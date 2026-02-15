'use server';

import { cookies } from 'next/headers';
import DIContainer from '@/server/infrastructure/di/container';
import GetStaffsUseCase from '@/server/application/use-cases/staff/GetStaffsUseCase';
import GetStaffUseCase from '@/server/application/use-cases/staff/GetStaffUseCase';
import CreateStaffUseCase from '@/server/application/use-cases/staff/CreateStaffUseCase';
import UpdateStaffUseCase from '@/server/application/use-cases/staff/UpdateStaffUseCase';
import DeleteStaffUseCase from '@/server/application/use-cases/staff/DeleteStaffUseCase';
import GetStaffLocationsUseCase from '@/server/application/use-cases/staff-location/GetStaffLocationsUseCase';

import CreateStaffLocationUseCase from '@/server/application/use-cases/staff-location/CreateStaffLocationUseCase';
import DeleteStaffLocationUseCase from '@/server/application/use-cases/staff-location/DeleteStaffLocationUseCase';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import type { CreateStaffDto } from '@/server/application/dtos/CreateStaffDto';
import type { UpdateStaffDto } from '@/server/application/dtos/UpdateStaffDto';
import type { StaffLocationDto } from '@/server/application/dtos/StaffLocationDto';
import type { CreateStaffLocationDto } from '@/server/application/dtos/CreateStaffLocationDto';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/features/common/utils/isAdmin';
import {
  STAFF_COOKIE_NAME,
  STAFF_COOKIE_MAX_AGE,
} from '@/features/staff/utils/staffCookie';

/**
 * 職員選択をcookieに保存
 */
export async function selectStaff(staffId: string | null): Promise<void> {
  const cookieStore = await cookies();
  if (staffId) {
    cookieStore.set(STAFF_COOKIE_NAME, staffId, {
      path: '/',
      maxAge: STAFF_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
  } else {
    cookieStore.delete(STAFF_COOKIE_NAME);
  }
}

/**
 * すべてのStaffを取得
 * @param sortOrder ソート順（'asc' | 'desc'）省略時は降順
 */
export async function getStaffs(sortOrder?: string): Promise<StaffDto[]> {
  const repository = DIContainer.getStaffRepository();
  const useCase = new GetStaffsUseCase(repository);
  return await useCase.execute(sortOrder);
}

/**
 * IDでStaffを取得
 */
export async function getStaff(id: string): Promise<StaffDto | null> {
  const repository = DIContainer.getStaffRepository();
  const useCase = new GetStaffUseCase(repository);
  const result = await useCase.execute(id);
  return result ?? null;
}

/**
 * Staffを作成
 */
export async function createStaff(formData: FormData): Promise<StaffDto> {
  requireAdmin();

  const emailValue = formData.get('email') as string | null;
  const dto: CreateStaffDto = {
    name: formData.get('name') as string,
    ...(emailValue?.trim() && { email: emailValue.trim() }),
  };

  // Use Case実行
  const repository = DIContainer.getStaffRepository();
  const useCase = new CreateStaffUseCase(repository);
  const result = await useCase.execute(dto);

  // キャッシュ無効化
  revalidatePath('/admin/staff');

  return result;
}

/**
 * Staffを更新
 */
export async function updateStaff(
  id: string,
  formData: FormData
): Promise<StaffDto> {
  requireAdmin();

  const dto: UpdateStaffDto = {};

  if (formData.has('name')) {
    dto.name = formData.get('name') as string;
  }

  if (formData.has('email')) {
    const emailValue = (formData.get('email') as string)?.trim();
    dto.email = emailValue || null;
  }

  // Use Case実行
  const repository = DIContainer.getStaffRepository();
  const useCase = new UpdateStaffUseCase(repository);
  const result = await useCase.execute(id, dto);

  // キャッシュ無効化
  revalidatePath('/admin/staff');
  revalidatePath(`/admin/staff/${id}`);

  return result;
}

/**
 * Staffを削除（論理削除）
 */
export async function deleteStaff(id: string): Promise<boolean> {
  requireAdmin();

  const repository = DIContainer.getStaffRepository();
  const useCase = new DeleteStaffUseCase(repository);
  const result = await useCase.execute(id);

  // キャッシュ無効化
  revalidatePath('/admin/staff');

  return result;
}

// === 担当地域ピン関連 ===

/**
 * 職員の担当地域ピン一覧を取得
 */
export async function getStaffLocations(
  staffId: string
): Promise<StaffLocationDto[]> {
  const repository = DIContainer.getStaffLocationRepository();
  const useCase = new GetStaffLocationsUseCase(repository);
  return await useCase.execute(staffId);
}

/**
 * 担当地域ピンを作成
 */
export async function createStaffLocation(
  dto: CreateStaffLocationDto
): Promise<StaffLocationDto> {
  requireAdmin();

  const repository = DIContainer.getStaffLocationRepository();
  const useCase = new CreateStaffLocationUseCase(repository);
  const result = await useCase.execute(dto);

  // キャッシュ無効化
  revalidatePath(`/admin/staff/${dto.staffId}`);

  return result;
}

/**
 * 担当地域ピンを削除（論理削除）
 */
export async function deleteStaffLocation(
  id: string,
  staffId: string
): Promise<boolean> {
  requireAdmin();

  const repository = DIContainer.getStaffLocationRepository();
  const useCase = new DeleteStaffLocationUseCase(repository);
  const result = await useCase.execute(id);

  // キャッシュ無効化
  revalidatePath(`/admin/staff/${staffId}`);

  return result;
}
