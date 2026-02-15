import StaffId from '@/server/domain/models/StaffId';
import StaffEmail from '@/server/domain/value-objects/StaffEmail';
import StaffName from '@/server/domain/value-objects/StaffName';

/**
 * Staffエンティティのプロパティ
 */
interface StaffProps {
  id: StaffId;
  name: StaffName;
  email: StaffEmail | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Staff更新時のパラメータ
 */
export interface UpdateStaffParams {
  name?: StaffName;
  email?: StaffEmail | null;
}

/**
 * Staffエンティティ
 *
 * 職員情報を表すエンティティ。
 * ビジネスロジックとバリデーションを内包する。
 */
class Staff {
  private constructor(private props: StaffProps) {
    this.validate();
  }

  /**
   * 既存データからStaffを再構築
   */
  static create(props: StaffProps): Staff {
    return new Staff(props);
  }

  /**
   * バリデーション
   */
  private validate(): void {
    // 名前は値オブジェクトでバリデーション済み
  }

  /**
   * Staff情報を更新
   * @param params 更新パラメータ
   */
  update(params: UpdateStaffParams): void {
    if (params.name) {
      this.props.name = params.name;
    }

    if (params.email !== undefined) {
      this.props.email = params.email;
    }

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

  // Getters
  get id(): StaffId {
    return this.props.id;
  }

  get name(): StaffName {
    return this.props.name;
  }

  get email(): StaffEmail | null {
    return this.props.email;
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

export default Staff;
