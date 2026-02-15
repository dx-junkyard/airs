import FacilityId from '@/server/domain/models/FacilityId';
import StaffId from '@/server/domain/models/StaffId';
import Location from '@/server/domain/value-objects/Location';

/**
 * Facilityエンティティのプロパティ
 */
interface FacilityProps {
  id: FacilityId;
  staffId: StaffId;
  overpassId: string | null;
  name: string;
  category: string;
  location: Location;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Facilityエンティティ
 *
 * 職員に紐づく周辺施設（ランドマーク）を表すエンティティ。
 * isSharedがtrueの場合、アプリ内の全ての地図にマーカーとして表示される。
 */
class Facility {
  private constructor(private props: FacilityProps) {}

  /**
   * 既存データからFacilityを再構築
   */
  static create(props: FacilityProps): Facility {
    return new Facility(props);
  }

  /**
   * 全体共有フラグを切り替え
   */
  toggleShared(isShared: boolean): void {
    this.props.isShared = isShared;
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
  get id(): FacilityId {
    return this.props.id;
  }

  get staffId(): StaffId {
    return this.props.staffId;
  }

  get overpassId(): string | null {
    return this.props.overpassId;
  }

  get name(): string {
    return this.props.name;
  }

  get category(): string {
    return this.props.category;
  }

  get location(): Location {
    return this.props.location;
  }

  get isShared(): boolean {
    return this.props.isShared;
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

export default Facility;
