import { NextRequest, NextResponse } from 'next/server';
import { signUpSchema } from '@/schema';
import { signUp } from '@/server/actions/auth.action';

/**
 * User Registration API
 *
 * Input format:
 * - Method: POST
 * - Headers: Content-Type: application/json
 * - Body (JSON):
 *   {
 *     "email": "string",         // User email, required
 *     "password": "string",       // User password, required
 *     "confirmPassword": "string", // Password confirmation, required
 *     "name": "string"            // User nickname, optional
 *   }
 *
 * Password requirements:
 * - At least 8 characters
 * - Contains letters
 * - Contains numbers
 *
 * Success response:
 * - Status: 201
 * - Body (JSON):
 *   {
 *     "success": true,
 *     "message": "Registration successful",
 *     "data": {
 *       "redirect": "string"
 *     }
 *   }
 *
 * Error responses:
 * - 400: Invalid request parameters
 * - 409: Email already exists
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, 
          error: 'Invalid request body, must be valid JSON' 
        },
        { status: 400 }
      );
    }

    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid request parameters';
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const result = await signUp(parsed.data);

    if (!result.success) {
      const status = result.error.includes('already exists') ? 409 : 500;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        data: {
          redirect: result.data.redirect,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error, please try again later' },
      { status: 500 }
    );
  }
}
