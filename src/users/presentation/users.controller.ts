import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { USER_ROLE } from '@lms/shared';

import { UsersService } from '../application/users.service';
import { AdminCreateUserDto } from '../application/dto/create-user.dto';
import { UpdateUserDto } from '../application/dto/update-user.dto';
import { UpdateRoleDto } from '../application/dto/update-role.dto';
import { UserQueryDto } from '../application/dto/user-query.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(USER_ROLE.ADMINISTRADOR, USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'List users with pagination and filters' })
  @ApiOkResponse({ description: 'Lista paginada de usuarios' })
  @ApiBadRequestResponse({ description: 'Parametros de consulta invalidos' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({
    description: 'Solo administradores e instructores pueden listar usuarios',
  })
  async findAll(@Query() query: UserQueryDto) {
    return this.usersService.findPaginated(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Create user manually (admin only, instructor/admin roles)' })
  @ApiCreatedResponse({ description: 'Usuario creado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos del usuario invalidos o email ya registrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Solo los administradores pueden crear usuarios' })
  async create(@Body() dto: AdminCreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get(':id')
  @Roles(USER_ROLE.ADMINISTRADOR, USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiOkResponse({ description: 'Datos del usuario' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Solo administradores e instructores pueden ver usuarios' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles(USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Update user (admin only)' })
  @ApiOkResponse({ description: 'Usuario actualizado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos de actualizacion invalidos' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Solo los administradores pueden actualizar usuarios' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/role')
  @Roles(USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Update user role (admin only)' })
  @ApiOkResponse({ description: 'Rol del usuario actualizado exitosamente' })
  @ApiBadRequestResponse({ description: 'Rol invalido' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Solo los administradores pueden cambiar roles' })
  async updateRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }

  @Patch(':id/deactivate')
  @Roles(USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Deactivate user (admin only)' })
  @ApiOkResponse({ description: 'Usuario desactivado exitosamente' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Solo los administradores pueden desactivar usuarios' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/reactivate')
  @Roles(USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Reactivate user (admin only)' })
  @ApiOkResponse({ description: 'Usuario reactivado exitosamente' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Solo los administradores pueden reactivar usuarios' })
  async reactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.reactivate(id);
  }
}
