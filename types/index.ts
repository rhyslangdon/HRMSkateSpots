// =============================================================================
// SHARED TYPE DEFINITIONS
// =============================================================================
// Place your shared TypeScript types and interfaces in this file.
// Types that are used across multiple components or pages belong here.
//
// STUDENT: Add your own types as you build features. For example:
//   - User type for your auth system
//   - Product/Item types for your core data
//   - API response types
//
// Types specific to a single component can stay in that component's file.
// =============================================================================

/**
 * Example type — demonstrates the pattern for defining shared types.
 * STUDENT: Replace this with your actual application types.
 */
export interface ExampleItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

/**
 * Standard API response wrapper.
 * Use this pattern to keep your API responses consistent.
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Standard API error response.
 */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export type SpotType = 'street' | 'park' | 'diy' | 'transition' | 'flatground' | 'other';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'all';
export type StreetFeature = 'ledge' | 'stairs' | 'handrail' | 'gap' | 'bank' | 'other';

export interface Spot {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  spot_type: SpotType;
  street_feature: StreetFeature | null;
  difficulty: Difficulty;
  image_url: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpotFormData {
  name: string;
  description: string;
  address: string;
  spot_type: SpotType;
  street_feature: StreetFeature | null;
  difficulty: Difficulty;
}

/**
 * Possible values for the `role` column in the `profiles` table.
 * Determines access level: 'admin' users can access /admin routes.
 */
export type UserRole = 'user' | 'admin';

/**
 * Possible values for the `subscription_status` column in the `profiles` table.
 * Controls feature access: 'premium' unlocks paid features.
 */
export type SubscriptionStatus = 'free' | 'premium';

/**
 * Mirrors a row from the `profiles` table in Supabase.
 * Extends Supabase Auth by storing role and subscription data.
 * The `id` foreign-keys to `auth.users.id`.
 */
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  created_at: string;
}
