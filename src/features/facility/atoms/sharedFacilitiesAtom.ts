import { atom } from 'jotai';
import type { FacilityDto } from '@/server/application/dtos/FacilityDto';

export const sharedFacilitiesAtom = atom<FacilityDto[]>([]);
