import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './presentation/auth.controller';
import { AuthService } from './application/auth.service';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';
import { MockTokenValidationAdapter } from './infrastructure/mock-token-validation.adapter';
import { AzureAdTokenValidationAdapter } from './infrastructure/azure-ad-token-validation.adapter';
import { GoogleTokenValidationAdapter } from './infrastructure/google-token-validation.adapter';
import { MockGoogleTokenValidationAdapter } from './infrastructure/mock-google-token-validation.adapter';
import { TOKEN_VALIDATION_PORT, GOOGLE_TOKEN_VALIDATION_PORT } from './domain/ports';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('auth.jwtSecret'),
        signOptions: {
          expiresIn: config.get<string>('auth.jwtExpiresIn', '8h'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    {
      provide: TOKEN_VALIDATION_PORT,
      useFactory: (config: ConfigService) => {
        if (config.get<boolean>('auth.useMock') === true) {
          return new MockTokenValidationAdapter();
        }
        return new AzureAdTokenValidationAdapter(
          config.getOrThrow<string>('auth.azureAdTenantId'),
          config.getOrThrow<string>('auth.azureAdClientId'),
        );
      },
      inject: [ConfigService],
    },
    {
      provide: GOOGLE_TOKEN_VALIDATION_PORT,
      useFactory: (config: ConfigService) => {
        if (config.get<boolean>('auth.googleUseMock') === true) {
          return new MockGoogleTokenValidationAdapter();
        }
        return new GoogleTokenValidationAdapter(config.getOrThrow<string>('auth.googleClientId'));
      },
      inject: [ConfigService],
    },
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
