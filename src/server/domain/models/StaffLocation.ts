import StaffLocationId from '@/server/domain/models/StaffLocationId';
import StaffId from '@/server/domain/models/StaffId';
import Location from '@/server/domain/value-objects/Location';

/**
 * StaffLocationエンティティのプロパティ
 */
interface StaffLocationProps {
  id: StaffLocationId;
  staffId: StaffId;
  location: Location;
  label: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * StaffLocation更新時のパラメータ
 */
export interface UpdateStaffLocationParams {
  location?: Location;
  label?: string | null;
}

/**
 * StaffLocationエンティティ
 *
 * 職員の担当地域ピンを表すエンティティ。
 * 1人の職員は複数のピンを持つことができ、
 * 通報が入った際に最も近いピンを持つ職員が自動アサインされる。
 */
class StaffLocation {
  private constructor(private props: StaffLocationProps) {}

  /**
   * 既存データからStaffLocationを再構築
   */
  static create(props: StaffLocationProps): StaffLocation {
    return new StaffLocation(props);
  }

  /**
   * 更新
   */
  update(params: UpdateStaffLocationParams): void {
    if (params.location) {
      this.props.location = params.location;
    }
    if (params.label !== undefined) {
      this.props.label = params.label;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * 論理削除
   */
  softDelete(): void {
    if (this.props.deletedAt !== null) {
      throw new Error('すでに削除されています');
    }
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  // Getters
  get id(): StaffLocationId {
    return this.props.id;
  }

  get staffId(): StaffId {
    return this.props.staffId;
  }

  get location(): Location {
    return this.props.location;
  }

  get label(): string | null {
    return this.props.label;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }
}

export default StaffLocation;
