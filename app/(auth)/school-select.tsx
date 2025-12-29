import { View, Text, TouchableOpacity, Platform, TextInput, FlatList, ActivityIndicator } from "react-native";
import { MenuView, MenuComponentRef } from '@react-native-menu/menu';
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { ChevronDownIcon, Icon } from "@/components/ui/icon";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import CircleCountryFlag, { CountryCode } from 'react-native-circle-flags/country';
import Animated, { FadeInUp, FlipInXUp, withSpring, withTiming, interpolate } from 'react-native-reanimated';
const states = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

interface District {
  id: string;
  district_app_name: string;
  district_baseurl: string;
  district_code: string;
  district_name: string;
  staff_login_url: string;
  student_login_url: string;
  parent_login_url: string;
  state_code: string;
}

const API_BASE_URL = 'http://localhost:3000';

export default function SchoolSelect() {
  const menuRef = useRef<MenuComponentRef>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const headerHeight = 56;
  const topPadding = insets.top + headerHeight;

  const selectedStateName = selectedState 
    ? states.find(state => state.code === selectedState)?.name || 'Select a state'
    : 'Select a state';

  const actions = states.map((state) => ({
    id: state.code,
    title: state.name,
  }));

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedState || searchQuery.length < 3) {
        setDistricts([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/ic/districts?state=${selectedState}&query=${encodeURIComponent(searchQuery)}`
        );
        const result = await response.json() as { ok: boolean, data: District[] };
        if (result.ok) {
          setDistricts(result.data);
        }
      } catch (error) {
        console.error('Error fetching districts:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchDistricts, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedState, searchQuery]);

  const handleDistrictSelect = (district: District) => {
    router.push({
      pathname: '/(auth)/auth-modal',
      params: { uri: district.student_login_url.replace('/campus/portal/', '/campus/portal/students/') }
    });
  };

  return (
    <View className="flex-1 bg-teal-950">
      <Stack.Screen options={{ title: 'Select School' }} />
      <View style={{ paddingTop: topPadding }} className="p-4 flex-1">
        <Text className="text-white text-2xl font-bold text-left pb-4">Let's find your school:</Text>
        <MenuView
          ref={menuRef}
          title="Select a state"
          onPressAction={({ nativeEvent }) => {
            setSelectedState(nativeEvent.event);
            setSearchQuery('');
            setDistricts([]);
          }}
          actions={actions}
          shouldOpenOnLongPress={false}
        >
          <Button
            title={selectedStateName}
            onPress={() => menuRef.current?.show()}
            className="w-full bg-white text-red items-left flex-row mb-4"
          >  
            {(selectedState ? <CircleCountryFlag code={`us-${selectedState.toLowerCase()}` as CountryCode} size={24} /> : <Icon as={ChevronDownIcon} size="md" color="black" className="mt-1" />)}
            <Text className="text-slate-950 text-lg font-semibold text-left ml-2">{selectedStateName}</Text>
          </Button>
        </MenuView>

        {selectedState && (
          <View className="mb-4">
            <TextInput
              className="bg-white rounded-xl p-4 text-slate-950 text-lg"
              placeholder="Search for your school or district..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ minHeight: 56 }}
            />
            {searchQuery.length < 3 && (
              <Text className="text-white text-sm mt-2">Type at least 3 characters to search</Text>
            )}
          </View>
        )}

        {!loading && districts.length > 0 && (
          <FlatList
            data={districts}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
                <Animated.View
                entering={FadeInUp.delay(index * 20).damping(15)}
                className="mb-3"
              >
                <TouchableOpacity
                  onPress={() => handleDistrictSelect(item)}
                  className="bg-slate-100 rounded-lg p-4 flex-row items-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-slate-950 text-lg font-semibold flex-1">{item.district_name}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
            showsVerticalScrollIndicator={true}
          />
        )}

        {!loading && searchQuery.length >= 3 && districts.length === 0 && (
          <View className="py-4">
            <Text className="text-white text-center">No schools/school districts found. Try your district name instead?</Text>
          </View>
        )}
      </View>
    </View>
  );
}