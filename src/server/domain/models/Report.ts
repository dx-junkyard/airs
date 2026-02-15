import ReportId from '@/server/domain/models/ReportId';
import Address from '@/server/domain/value-objects/Address';
import AnimalType from '@/server/domain/value-objects/AnimalType';
import ImageUrls from '@/server/domain/value-objects/ImageUrls';
import Location from '@/server/domain/value-objects/Location';
import PhoneNumber from '@/server/domain/value-objects/PhoneNumber';
import ReportStatus from '@/server/domain/value-objects/ReportStatus';

/**
 * Reportエンティティのプロパティ
 */
interface ReportProps {
  id: ReportId;
  animalType: AnimalType;
  location: Location;
  address: Address;
  phoneNumber?: PhoneNumber;
  imageUrls: ImageUrls;
  description?: string;
  status: ReportStatus;
  staffId?: string;
  staffName?: string; // 読み取り専用（JOINで取得）
  areaKey?: string; // 読み取り専用（normalizedAddressから取得）
  areaRegionLabel?: string; // 読み取り専用（normalizedAddressから取得: 都道府県+市区町村）
  areaChomeLabel?: string; // 読み取り専用（normalizedAddressから取得: 大字+字）
  eventId?: string; // 読み取り専用（JOINで取得）
  eventReportCount?: number; // 読み取り専用（JOINで取得）
  hasOnlyDate: boolean;
  createdAt: Date;
  deletedAt: Date | null;
  updatedAt: Date;
}

/**
 * Report更新時のパラメータ
 */
export interface UpdateReportParams {
  animalType?: AnimalType;
  location?: Location;
  address?: Address;
  phoneNumber?: PhoneNumber;
  imageUrls?: ImageUrls;
  description?: string;
  staffId?: string | null;
}

/**
 * Reportエンティティ
 *
 * 野生動物通報の情報を表すエンティティ。
 * ビジネスロジックとバリデーションを内包する。
 */
class Report {
  private constructor(private props: ReportProps) {
    this.validate();
  }

  /**
   * 既存データからReportを再構築
   */
  static create(props: ReportProps): Report {
    return new Report(props);
  }

  /**
   * バリデーション
   */
  private validate(): void {
    // 説明はオプショナル
    // 他の必須項目のバリデーションがあればここに追加
  }

  /**
   * ステータスを更新
   * @param newStatus 新しいステータス
   * @throws {Error} 不正なステータス遷移の場合
   */
  updateStatus(newStatus: ReportStatus): void {
    if (!this.props.status.canTransitionTo(newStatus)) {
      throw new Error(
        `ステータス ${this.props.status.value} から ${newStatus.value} への遷移は不正です`
      );
    }

    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  /**
   * 論理削除
   * @throws {Error} 既に削除済みの場合
   */
  softDelete(): void {
    if (this.props.deletedAt !== null) {
      throw new Error('すでに削除されています');
    }

    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * 削除済みかどうか
   */
  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  /**
   * Report情報を更新
   * @param params 更新パラメータ
   */
  update(params: UpdateReportParams): void {
    if (params.animalType) {
      this.props.animalType = params.animalType;
    }

    if (params.location) {
      this.props.location = params.location;
    }

    if (params.address) {
      this.props.address = params.address;
    }

    if (params.phoneNumber !== undefined) {
      this.props.phoneNumber = params.phoneNumber;
    }

    if (params.imageUrls) {
      this.props.imageUrls = params.imageUrls;
    }

    if (params.description !== undefined) {
      // 説明はオプショナルなので空文字列も許可
      this.props.description = params.description || undefined;
    }

    if (params.staffId !== undefined) {
      // staffIdはnullで担当解除、文字列で担当設定
      this.props.staffId = params.staffId ?? undefined;
    }

    this.props.updatedAt = new Date();
  }

  // Getters
  get id(): ReportId {
    return this.props.id;
  }

  get animalType(): AnimalType {
    return this.props.animalType;
  }

  get location(): Location {
    return this.props.location;
  }

  get address(): Address {
    return this.props.address;
  }

  get phoneNumber(): PhoneNumber | undefined {
    return this.props.phoneNumber;
  }

  get imageUrls(): ImageUrls {
    return this.props.imageUrls;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get status(): ReportStatus {
    return this.props.status;
  }

  get staffId(): string | undefined {
    return this.props.staffId;
  }

  get staffName(): string | undefined {
    return this.props.staffName;
  }

  get areaKey(): string | undefined {
    return this.props.areaKey;
  }

  get areaRegionLabel(): string | undefined {
    return this.props.areaRegionLabel;
  }

  get areaChomeLabel(): string | undefined {
    return this.props.areaChomeLabel;
  }

  get eventId(): string | undefined {
    return this.props.eventId;
  }

  get eventReportCount(): number | undefined {
    return this.props.eventReportCount;
  }

  get hasOnlyDate(): boolean {
    return this.props.hasOnlyDate;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

export default Report;
