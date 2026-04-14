import { prisma } from "../../shared/prisma.client";

class DepartmentsService {
  findAll() {
    return prisma.department.findMany({ orderBy: { name: "asc" } });
  }
}

export const departmentsService = new DepartmentsService();
