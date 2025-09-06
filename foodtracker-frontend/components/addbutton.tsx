import { Colors } from "@/constants/Colors";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { IconButton } from "react-native-paper";

import AddModal from "./addmodal";

export default function AddButton({ onPress }: { onPress?: () => void }) {
  const colorScheme = useColorScheme();

  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    setModalVisible(true);
    onPress?.();
  };

  return (
    <>
      <IconButton
        icon="plus"
        mode="contained-tonal"
        containerColor={Colors[colorScheme ?? "light"].tint}
        style={{ alignSelf: "center" }}
        size={24}
        onPress={handlePress}
      ></IconButton>

      <AddModal isVisible={modalVisible} onClose={() => setModalVisible(false)}>
        <Text style={styles.modalTitle}>Add New Item</Text>
        <Text style={styles.modalText}>This is your popup content!</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalButton, styles.confirmButton]}
            onPress={() => {
              // Handle your action here
              console.log("Action confirmed");
              setModalVisible(false);
            }}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </AddModal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  overlay: {
    flex: 1,
    // backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  confirmButton: {
    backgroundColor: "#007AFF",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "500",
  },
});
