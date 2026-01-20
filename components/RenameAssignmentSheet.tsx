import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { useCallback, useState, useEffect } from 'react'
import { useWhatIf } from '@/app/(protected)/(course)/_context'

export function RenameAssignmentSheet() {
  const { renameSheetRef, renamingAssignment, renameVirtualAssignment, closeRenameSheet } = useWhatIf()
  const [nameValue, setNameValue] = useState('')

  useEffect(() => {
    if (renamingAssignment) {
      setNameValue(renamingAssignment.assignmentName)
    }
  }, [renamingAssignment])

  const handleSave = useCallback(() => {
    if (renamingAssignment && nameValue.trim()) {
      renameVirtualAssignment(renamingAssignment.objectSectionID, nameValue.trim())
      closeRenameSheet()
    }
  }, [renamingAssignment, nameValue, renameVirtualAssignment, closeRenameSheet])

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
      closeRenameSheet()
    }
  }, [closeRenameSheet])

  return (
    <BottomSheet
      ref={renameSheetRef}
      index={-1}
      snapPoints={[280]}
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
          <Text className="text-white text-2xl font-bold mb-6">
            Rename Assignment
          </Text>
          
          <View className="mb-6">
            <TextInput
              className="bg-stone-700 text-white text-xl font-semibold px-4 py-3 rounded-xl"
              value={nameValue}
              onChangeText={setNameValue}
              placeholder="Assignment name"
              placeholderTextColor="#78716c"
              autoFocus
            />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={closeRenameSheet}
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
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheet>
  )
}

