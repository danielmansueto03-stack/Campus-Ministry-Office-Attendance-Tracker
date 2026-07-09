import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. Change the function name to "proxy"
export function proxy(request: NextRequest) { 
  return NextResponse.next();
}

// 2. Your matcher config stays exactly the same
export const config = {
  matcher: '/dashboard/:path*',
}