
import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface LocationDetails {
  region: string;
  province: string;
  city: string;
  barangay: string;
}

interface AddressSelectorProps {
  onAddressChange: (address: string) => void;
  onLocationDetails?: (details: LocationDetails) => void; // New prop for system setup
}

interface PsgcItem {
  code: string;
  name: string;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({ onAddressChange, onLocationDetails }) => {
  // Data States
  const [regions, setRegions] = useState<PsgcItem[]>([]);
  const [provinces, setProvinces] = useState<PsgcItem[]>([]);
  const [cities, setCities] = useState<PsgcItem[]>([]);
  const [barangays, setBarangays] = useState<PsgcItem[]>([]);

  // Selection States
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('');
  const [street, setStreet] = useState('');

  // Loading States
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Helper with Error Handling
  const fetchData = async (url: string, setter: React.Dispatch<React.SetStateAction<PsgcItem[]>>, loader: React.Dispatch<React.SetStateAction<boolean>>) => {
    loader(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      // Sort alphabetically if data is an array
      if (Array.isArray(data)) {
        const sorted = data.sort((a: PsgcItem, b: PsgcItem) => a.name.localeCompare(b.name));
        setter(sorted);
      } else {
        console.error("Invalid data format received", data);
        setter([]);
      }
    } catch (err) {
      console.error(err);
      setError("Address service unavailable. Please check internet.");
      setter([]);
    } finally {
      loader(false);
    }
  };

  // Initial Load (Regions)
  useEffect(() => {
    fetchData('https://psgc.gitlab.io/api/regions/', setRegions, setLoadingRegions);
  }, []);

  // Handle Region Change
  const handleRegionChange = (code: string) => {
    setSelectedRegion(code);
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedBarangay('');
    setProvinces([]);
    setCities([]);
    setBarangays([]);
    
    if (code) {
      fetchData(`https://psgc.gitlab.io/api/regions/${code}/provinces/`, setProvinces, setLoadingProvinces);
    }
  };

  // Handle Province Change
  const handleProvinceChange = (code: string) => {
    setSelectedProvince(code);
    setSelectedCity('');
    setSelectedBarangay('');
    setCities([]);
    setBarangays([]);

    if (code) {
      fetchData(`https://psgc.gitlab.io/api/provinces/${code}/cities-municipalities/`, setCities, setLoadingCities);
    }
  };

  // Handle City Change
  const handleCityChange = (code: string) => {
    setSelectedCity(code);
    setSelectedBarangay('');
    setBarangays([]);

    if (code) {
      fetchData(`https://psgc.gitlab.io/api/cities-municipalities/${code}/barangays/`, setBarangays, setLoadingBarangays);
    }
  };

  // Update Parent Component
  useEffect(() => {
    const r = regions.find(i => i.code === selectedRegion);
    const p = provinces.find(i => i.code === selectedProvince);
    const c = cities.find(i => i.code === selectedCity);
    const b = barangays.find(i => i.code === selectedBarangay);

    if (r && p && c && b) {
      // Return full string
      const fullAddress = `${street ? street + ', ' : ''}${b.name}, ${c.name}, ${p.name}, ${r.name}`;
      onAddressChange(fullAddress);

      // Return details object if requested (Used for Welcome Screen)
      if (onLocationDetails) {
        onLocationDetails({
          region: r.name,
          province: p.name,
          city: c.name,
          barangay: b.name
        });
      }
    } else {
      onAddressChange('');
    }
  }, [selectedRegion, selectedProvince, selectedCity, selectedBarangay, street, onAddressChange, regions, provinces, cities, barangays]);

  const mapToOptions = (items: PsgcItem[]) => items.map(i => ({ label: i.name, value: i.code }));

  return (
    <div className="space-y-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
           <MapPin className="w-4 h-4" />
        </div>
        <span className="text-sm font-bold text-slate-700">Address Selection</span>
        {error && (
           <span className="text-xs text-red-500 flex items-center gap-1 ml-auto bg-red-50 px-2 py-1 rounded-lg border border-red-100">
             <AlertCircle className="w-3 h-3" /> {error}
           </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <CustomSelect
          label="Region"
          value={selectedRegion}
          onChange={handleRegionChange}
          options={mapToOptions(regions)}
          loading={loadingRegions}
          placeholder="Select Region"
        />

        <CustomSelect
          label="Province / District"
          value={selectedProvince}
          onChange={handleProvinceChange}
          options={mapToOptions(provinces)}
          loading={loadingProvinces}
          disabled={!selectedRegion}
          placeholder="Select Province"
        />

        <CustomSelect
          label="City / Municipality"
          value={selectedCity}
          onChange={handleCityChange}
          options={mapToOptions(cities)}
          loading={loadingCities}
          disabled={!selectedProvince}
          placeholder="Select City/Mun"
        />

        <CustomSelect
          label="Barangay"
          value={selectedBarangay}
          onChange={setSelectedBarangay}
          options={mapToOptions(barangays)}
          loading={loadingBarangays}
          disabled={!selectedCity}
          placeholder="Select Barangay"
        />
      </div>

      {/* Only show street input if onLocationDetails is NOT provided (implies we are in a registration form, not system setup) */}
      {!onLocationDetails && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Street / House No. / Purok</label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            disabled={!selectedBarangay}
            placeholder="e.g. Block 5, Lot 2, Purok 1"
            className="w-full px-3 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 disabled:bg-slate-50 text-sm text-slate-900"
          />
        </div>
      )}
    </div>
  );
};
