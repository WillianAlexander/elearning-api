import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from '../application/auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from '../domain/types';

class LoginDto {
  @IsString()
  @IsNotEmpty()
  /** The Azure AD JWT token */
  token!: string;
}

class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  /** The Google OAuth ID token */
  token!: string;
}

@ApiTags('Auth')
@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Validate an Azure AD token from the .NET 10 auth service.
   * Returns the user profile with LMS roles.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Azure AD token' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Login exitoso, retorna perfil del usuario' })
  @ApiBadRequestResponse({ description: 'Token de Azure AD invalido o malformado' })
  @ApiUnauthorizedResponse({ description: 'Token de Azure AD no autorizado o expirado' })
  async login(@Body('token') token: string) {
    const user = await this.authService.validateTokenAndGetUser(token);
    return { user };
  }

  /**
   * Login with a Google OAuth ID token.
   * Only works for pre-registered users (admin/instructor).
   */
  @Post('login/google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Google OAuth ID token' })
  @ApiBody({ type: GoogleLoginDto })
  @ApiOkResponse({ description: 'Login con Google exitoso, retorna usuario y token de acceso' })
  @ApiBadRequestResponse({ description: 'Token de Google invalido o malformado' })
  @ApiUnauthorizedResponse({ description: 'Token de Google no autorizado o usuario no registrado' })
  async loginWithGoogle(@Body('token') token: string) {
    const result = await this.authService.validateGoogleTokenAndGetUser(token);
    return { user: result.user, accessToken: result.accessToken };
  }

  /**
   * Get the current authenticated user's profile.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiOkResponse({ description: 'Perfil del usuario autenticado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }

  /**
   * Logout the current user.
   * Since NestJS doesn't manage sessions/tokens, this is a no-op
   * that the frontend uses to clear its local state.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  @ApiOkResponse({ description: 'Logout exitoso' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  logout(@CurrentUser() user: AuthenticatedUser) {
    return { message: `User ${user.email} logged out successfully` };
  }
}
