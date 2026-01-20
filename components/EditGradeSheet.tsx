import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { useCallback, useState, useEffect } from 'react'
import { useWhatIf } from '@/app/(protected)/(course)/_context'

export function EditGradeSheet() {
  const { sheetRef, editingAssignment, editGrade, closeEditSheet } = useWhatIf()
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (editingAssignment) {
      setInputValue(editingAssignment.score ?? '')
    }
  }, [editingAssignment])

  const handleSave = useCallback(() => {
    if (editingAssignment) {
      const trimmed = inputValue.trim()
      editGrade(editingAssignment.objectSectionID, trimmed === '' ? null : trimmed)
      closeEditSheet()
    }
  }, [editingAssignment, inputValue, editGrade, closeEditSheet])

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
      closeEditSheet()
    }
  }, [closeEditSheet])

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={[300]}
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
            Edit Grade
          </Text>
          {editingAssignment && (
            <>
              <Text className="text-stone-400 text-lg mb-6" numberOfLines={2}>
                {editingAssignment.assignmentName}
              </Text>
              
              <View className="flex-row items-center mb-6">
                <TextInput
                  className="bg-stone-700 text-white text-2xl font-semibold px-4 py-3 rounded-xl flex-1"
                  value={inputValue}
                  onChangeText={setInputValue}
                  keyboardType="decimal-pad"
                  placeholder="Score"
                  placeholderTextColor="#78716c"
                  autoFocus
                />
                <Text className="text-stone-400 text-2xl font-semibold mx-3">/</Text>
                <Text className="text-stone-400 text-2xl font-semibold">
                  {editingAssignment.totalPoints}
                </Text>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={closeEditSheet}
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
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheet>
  )
}

