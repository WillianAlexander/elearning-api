/**
 * Base entity interface with common columns.
 * With Prisma, these fields are defined in schema.prisma.
 * This interface is kept for type compatibility with existing services.
 */
export abstract class BaseEntity {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date | null;
}
