import { router, Stack } from 'expo-router';
import { SearchProvider, useSearch } from './_context';
import { Pressable, Text } from 'react-native';

function SearchStack() {
  const { setQuery } = useSearch();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Search Assignments',
          headerTitleStyle: { color: '#fff' },
          //headerShown: false,
          /*
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
          ),
          */
          headerStyle: { backgroundColor: 'transparent' },
          headerSearchBarOptions: {
            placement: 'automatic',
            placeholder: 'Find an assignment',
            onChangeText: (e) => setQuery(e.nativeEvent.text),


          },
        }}
      />
    </Stack>
  );
}

export default function SearchLayout() {
  return (
    <SearchProvider>
      <SearchStack />
    </SearchProvider>
  );
}
