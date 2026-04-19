import { NextRequest, NextResponse } from 'next/server';
import { signInSchema } from '@/schema';
import { signIn } from '@/server/actions/auth.action';

/**
 * User Login API
 *
 * Input format:
 * - Method: POST
 * - Headers: Content-Type: application/json
 * - Body (JSON):
 *   {
 *     "email": "string",    // User email, required
 *     "password": "string"  // User password, required
 *   }
 *
 * Success response:
 * - Status: 200
 * - Body (JSON):
 *   {
 *     "success": true,
 *     "message": "Login successful",
 *     "data": {
 *       "redirect": "string"
 *     }
 *   }
 *
 * Error responses:
 * - 400: Invalid request parameters
 * - 401: Authentication failed (invalid email or password)
 * - 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body, must be valid JSON' },
        { status: 400 }
      );
    }

    const parsed = signInSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid request parameters';
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const result = await signIn(parsed.data);

    if (!result.success) {
      const status = result.error.includes('Invalid email or password') ? 401 : 500;
      return NextResponse.json(
        { success: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          redirect: result.data.redirect,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error, please try again later' },
      { status: 500 }
    );
  }
}
