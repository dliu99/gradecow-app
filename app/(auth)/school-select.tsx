import { View, Text, TouchableOpacity, Platform } from "react-native";
import { MenuView, MenuComponentRef } from '@react-native-menu/menu';
import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { ChevronDownIcon, Icon } from "@/components/ui/icon";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
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

export default function SchoolSelect() {
  const menuRef = useRef<MenuComponentRef>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const insets = useSafeAreaInsets();
  
  const headerHeight = 56;
  const topPadding = insets.top + headerHeight;

  const selectedStateName = selectedState 
    ? states.find(state => state.code === selectedState)?.name || 'Select a state'
    : 'Select a state';

  const actions = states.map((state) => ({
    id: state.code,
    title: state.name,
  }));

  return (
    <SafeAreaView className="flex-1 bg-teal-950" edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: 'Select State' }} />
      <View style={{ paddingTop: topPadding }} className="p-4">
        <Text className="text-white text-2xl font-bold text-left pb-4">Let's find your school:</Text>
        <MenuView
          ref={menuRef}
          title="Select a state"
          onPressAction={({ nativeEvent }) => {
            setSelectedState(nativeEvent.event);
          }}
          actions={actions}
          shouldOpenOnLongPress={false}
        >
          <Button
            title={selectedStateName}
            onPress={() => menuRef.current?.show()}
            className="w-full bg-white text-red items-left flex-row"
          >  
            <Icon as={ChevronDownIcon} size="md" color="black" className="mt-1" />
            <Text className="text-slate-950 text-lg font-semibold text-left ml-2">{selectedStateName}</Text>
          </Button>
        </MenuView>
      </View>
    </SafeAreaView>
  );
}