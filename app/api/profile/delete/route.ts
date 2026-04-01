import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';

const DEFAULT_DELETED_USER_EMAIL = 'hrmskatespots@gmail.com';

async function findAuthUserByEmail(
  admin: ReturnType<typeof createServiceRoleClient>,
  email: string
) {
  let page = 1;
  const perPage = 50;
  // Going through the users list to match with the authenticated user (built in supabase listUsers)
  while (true) {
    const { data: usersData, error: listUsersError } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (listUsersError) {
      throw new Error(`Failed to load users: ${listUsersError.message}`);
    }

    const authUsers = usersData.users as Array<{ id: string; email?: string | null }>;
    const foundUser = authUsers.find((u) => u.email?.toLowerCase() === email) ?? null;

    if (foundUser) {
      return foundUser;
    }

    const nextPage =
      'nextPage' in usersData && typeof usersData.nextPage === 'number' ? usersData.nextPage : null;

    if (!nextPage) {
      return null;
    }

    page = nextPage;
  }
}

async function ensureDeletedUserProfile() {
  const admin = createServiceRoleClient();
  // Use one reserved account as the canonical owner for content from deleted users.
  const deletedUserEmail = (process.env.DELETED_USER_EMAIL ?? DEFAULT_DELETED_USER_EMAIL)
    .trim()
    .toLowerCase();

  // if a profile already exists for the reserved email, reuse it directly.
  // this avoids unnecessary auth admin user creation attempts
  const { data: existingProfile, error: existingProfileError } = await admin
    .from('profiles')
    .select('id')
    .eq('email', deletedUserEmail)
    .maybeSingle();

  if (existingProfileError) {
    throw new Error(`Failed to load deleted user profile: ${existingProfileError.message}`);
  }

  if (existingProfile?.id) {
    return { admin, deletedUserId: existingProfile.id, deletedUserEmail };
  }

  let deletedUser = await findAuthUserByEmail(admin, deletedUserEmail);

  if (!deletedUser) {
    // Create the placeholder account once if it does not exist yet.
    const { data: createdUserData, error: createUserError } = await admin.auth.admin.createUser({
      email: deletedUserEmail,
      password: `${crypto.randomUUID()}-deleted-user`,
      email_confirm: true,
      user_metadata: {
        system: true,
        reason: 'placeholder-owner-for-deleted-accounts',
      },
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
    });

    if (createUserError || !createdUserData.user) {
      // Some duplicate-email failures are returned as generic DB errors.
      // Always re-check for the account before failing.
      deletedUser = await findAuthUserByEmail(admin, deletedUserEmail);

      if (!deletedUser) {
        throw new Error(createUserError?.message || 'Failed to create deleted user account.');
      }
    } else {
      deletedUser = createdUserData.user;
    }
  }

  const { error: upsertProfileError } = await admin.from('profiles').upsert(
    {
      id: deletedUser.id,
      email: deletedUser.email ?? deletedUserEmail,
      display_name: 'Deleted User',
      role: 'user',
      subscription_status: 'free',
    },
    {
      onConflict: 'id',
    }
  );

  if (upsertProfileError) {
    throw new Error(`Failed to ensure deleted user profile: ${upsertProfileError.message}`);
  }

  // Return both clients and identifiers needed for ownership reassignment.
  return { admin, deletedUserId: deletedUser.id, deletedUserEmail };
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { admin, deletedUserId, deletedUserEmail } = await ensureDeletedUserProfile();

    // Guard against deleting the reserved placeholder account itself.
    if (deletedUserId === user.id || user.email?.toLowerCase() === deletedUserEmail) {
      return NextResponse.json(
        { error: 'Deleted user placeholder cannot be deleted.' },
        { status: 400 }
      );
    }

    const { data: ownedSpots, error: ownedSpotsError } = await admin
      .from('spots')
      .select('id')
      .eq('user_id', user.id);

    if (ownedSpotsError) {
      return NextResponse.json(
        { error: `Failed to fetch user spots: ${ownedSpotsError.message}` },
        { status: 500 }
      );
    }

    //Finding all the spots owned by the user
    const ownedSpotIds = (ownedSpots ?? []).map((spot) => spot.id);

    if (ownedSpotIds.length > 0) {
      // Saving the spots by reassigning user id to the hrmskatespots gmail account -
      // before anonymizing the source account
      const { error: reassignSpotsError } = await admin
        .from('spots')
        .update({ user_id: deletedUserId })
        .in('id', ownedSpotIds);

      if (reassignSpotsError) {
        return NextResponse.json(
          { error: `Failed to reassign spots: ${reassignSpotsError.message}` },
          { status: 500 }
        );
      }
    }

    const deletionTimestamp = new Date().toISOString();

    // Soft-delete profile data so personal identity is removed but row references remain valid.
    // This is the actual new data for the softdeleted record
    const { error: profileSoftDeleteError } = await admin
      .from('profiles')
      .update({
        email: `deleted+${user.id}@hrm-skate-spots.local`,
        display_name: 'Deleted User',
        avatar_url: null,
        role: 'user',
        subscription_status: 'free',
        updated_at: deletionTimestamp,
      })
      .eq('id', user.id);

    if (profileSoftDeleteError) {
      if (ownedSpotIds.length > 0) {
        // Best-effort rollback so spot ownership returns to the source user on failure.
        await admin.from('spots').update({ user_id: user.id }).in('id', ownedSpotIds);
      }

      return NextResponse.json(
        { error: `Failed to soft-delete profile: ${profileSoftDeleteError.message}` },
        { status: 500 }
      );
    }

    // Soft-delete auth identity to prevent future login using original credentials.
    const { error: softDeleteAuthError } = await admin.auth.admin.updateUserById(user.id, {
      email: `deleted+${user.id}@hrm-skate-spots.local`,
      password: `${crypto.randomUUID()}-soft-deleted`,
      user_metadata: {
        account_deleted: true,
        deleted_at: deletionTimestamp,
      },
    });

    if (softDeleteAuthError) {
      if (ownedSpotIds.length > 0) {
        // Best-effort rollback if auth update fails after spot reassignment.
        await admin.from('spots').update({ user_id: user.id }).in('id', ownedSpotIds);
      }

      return NextResponse.json(
        { error: `Failed to soft-delete auth user: ${softDeleteAuthError.message}` },
        { status: 500 }
      );
    }

    // End the current session on this device after account soft-deletion.
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true, mode: 'soft-deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete account.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
