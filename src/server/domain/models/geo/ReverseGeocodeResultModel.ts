import type Address from '@/server/domain/value-objects/Address';
import type StructuredAddressModel from '@/server/domain/models/geo/StructuredAddressModel';

interface ReverseGeocodeResultProps {
  address: Address;
  normalizedAddress: StructuredAddressModel;
}

class ReverseGeocodeResultModel {
  private constructor(private props: ReverseGeocodeResultProps) {}

  static create(props: ReverseGeocodeResultProps): ReverseGeocodeResultModel {
    return new ReverseGeocodeResultModel(props);
  }

  get address(): Address {
    return this.props.address;
  }

  get normalizedAddress(): StructuredAddressModel {
    return this.props.normalizedAddress;
  }
}

export default ReverseGeocodeResultModel;
