import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { useCallback, useState, useEffect } from 'react'
import { useWhatIf } from '@/app/(protected)/(course)/_context'

export function AddAssignmentSheet() {
  const { addSheetRef, addingToGroupID, addAssignment, closeAddSheet, getVirtualAssignmentCount } = useWhatIf()
  const [scoreValue, setScoreValue] = useState('')
  const [totalPointsValue, setTotalPointsValue] = useState('100')

  useEffect(() => {
    if (addingToGroupID !== null) {
      setScoreValue('')
      setTotalPointsValue('100')
    }
  }, [addingToGroupID])

  const handleSave = useCallback(() => {
    if (addingToGroupID !== null) {
      const score = scoreValue.trim()
      const totalPoints = parseFloat(totalPointsValue.trim()) || 100
      if (score !== '') {
        addAssignment(addingToGroupID, score, totalPoints)
        closeAddSheet()
      }
    }
  }, [addingToGroupID, scoreValue, totalPointsValue, addAssignment, closeAddSheet])

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  )

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      closeAddSheet()
    }
  }, [closeAddSheet])

  const assignmentNumber = addingToGroupID !== null ? getVirtualAssignmentCount(addingToGroupID) + 1 : 1

  return (
    <BottomSheet
      ref={addSheetRef}
      index={-1}
      snapPoints={[380]}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: '#292524' }}
      handleIndicatorStyle={{ backgroundColor: '#78716c' }}
      backdropComponent={renderBackdrop}
      onChange={handleSheetChanges}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={{ flex: 1, padding: 20 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Text className="text-white text-2xl font-bold mb-2">
            Add Assignment
          </Text>
          <Text className="text-stone-400 text-lg mb-6">
            My Assignment #{assignmentNumber}
          </Text>
          
          <View className="mb-4">
            <Text className="text-stone-400 text-base mb-2">Score</Text>
            <View className="flex-row items-center">
              <TextInput
                className="bg-stone-700 text-white text-2xl font-semibold px-4 py-3 rounded-xl flex-1"
                value={scoreValue}
                onChangeText={setScoreValue}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#78716c"
                autoFocus
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-stone-400 text-base mb-2">Total Points</Text>
            <TextInput
              className="bg-stone-700 text-white text-2xl font-semibold px-4 py-3 rounded-xl"
              value={totalPointsValue}
              onChangeText={setTotalPointsValue}
              keyboardType="decimal-pad"
              placeholder="100"
              placeholderTextColor="#78716c"
            />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={closeAddSheet}
              className="flex-1 bg-stone-700 py-4 rounded-xl"
            >
              <Text className="text-stone-300 text-center text-lg font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 bg-emerald-600 py-4 rounded-xl"
            >
              <Text className="text-white text-center text-lg font-semibold">
                Add
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheet>
  )
}

