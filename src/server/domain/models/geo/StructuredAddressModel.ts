export interface StructuredAddress {
  prefecture: string;
  city: string;
  oaza: string;
  aza: string;
  detail: string;
  full: string;
  areaKey: string;
  houseNumber?: string;
}

class StructuredAddressModel {
  private constructor(private props: StructuredAddress) {}

  static create(props: StructuredAddress): StructuredAddressModel {
    return new StructuredAddressModel({
      prefecture: props.prefecture ?? '',
      city: props.city ?? '',
      oaza: props.oaza ?? '',
      aza: props.aza ?? '',
      detail: props.detail ?? '',
      full: props.full ?? '',
      areaKey: props.areaKey ?? '',
      houseNumber: props.houseNumber ?? '',
    });
  }

  hasRequiredComponents(): boolean {
    return !!(this.props.prefecture && this.props.city && this.props.full);
  }

  get value(): StructuredAddress {
    return { ...this.props };
  }

  get houseNumber(): string {
    return this.props.houseNumber ?? '';
  }
}

export default StructuredAddressModel;
