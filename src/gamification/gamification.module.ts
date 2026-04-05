import { Module } from '@nestjs/common';

// Repositories
import { BadgeDefinitionRepository } from './infrastructure/badge-definition.repository';
import { UserBadgeRepository } from './infrastructure/user-badge.repository';

// Services
import { BadgesService } from './application/badges.service';

// Controllers
import { BadgesController } from './presentation/badges.controller';

// Auth module (for guards)
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BadgesController],
  providers: [
    // Repositories
    BadgeDefinitionRepository,
    UserBadgeRepository,

    // Services
    BadgesService,
  ],
  exports: [BadgesService],
})
export class GamificationModule {}
