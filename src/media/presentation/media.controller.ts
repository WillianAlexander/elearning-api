import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { USER_ROLE } from '@lms/shared';

import { MediaService } from '../application/media.service';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain/types';

/** Multer file shape — avoids dependency on @types/multer */
interface MulterFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('Media')
@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 500 * 1024 * 1024 }, // 500MB — reject before buffering completes
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file (multipart)' })
  async upload(
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const mediaFile = await this.mediaService.upload(
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
      user.id,
    );
    return mediaFile;
  }

  @Get(':id/url')
  @ApiOperation({ summary: 'Get presigned URL for a media file' })
  async getUrl(@Param('id', ParseUUIDPipe) id: string) {
    const url = await this.mediaService.getPresignedUrl(id);
    return { url };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Delete a media file' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.mediaService.deleteFile(id);
  }
}
