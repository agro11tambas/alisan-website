import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Address } from '@/types';

interface AddressState {
  addresses: Address[];
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, address: Omit<Address, 'id'>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set) => ({
      addresses: [],
      addAddress: (address) => set((state) => {
        const id = Math.random().toString(36).substring(2, 11);
        const newAddress = { ...address, id } as Address;
        
        let newAddresses = [...state.addresses];
        
        if (newAddresses.length === 0) {
          newAddress.isDefault = true;
        } else if (newAddress.isDefault) {
          newAddresses = newAddresses.map(a => ({ ...a, isDefault: false }));
        }
        
        return { addresses: [...newAddresses, newAddress] };
      }),
      updateAddress: (id, updatedFields) => set((state) => {
        let addresses = [...state.addresses];
        if (updatedFields.isDefault) {
          addresses = addresses.map(a => ({ ...a, isDefault: false }));
        }
        return {
          addresses: addresses.map(a => 
            a.id === id ? { ...updatedFields, id } as Address : a
          )
        };
      }),
      removeAddress: (id) => set((state) => {
        const remaining = state.addresses.filter(a => a.id !== id);
        if (remaining.length > 0 && state.addresses.find(a => a.id === id)?.isDefault) {
          remaining[0].isDefault = true;
        }
        return { addresses: remaining };
      }),
      setDefaultAddress: (id) => set((state) => ({
        addresses: state.addresses.map(a => ({
          ...a,
          isDefault: a.id === id
        }))
      }))
    }),
    {
      name: 'alisan-address-storage',
    }
  )
);
