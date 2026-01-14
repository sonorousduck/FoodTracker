import AddModal from "@/components/modal/addmodal";
import ThemedText from "@/components/themedtext";
import { Colors } from "@/constants/Colors";
import { localization } from "@/constants/localization";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import React, { useState } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import { IconButton } from "react-native-paper";

import { router } from "expo-router";
import AddModalPrimaryAction from "./addmodalprimaryaction";

export default function AddButton({ onPress }: { onPress?: () => void }) {
        const colorScheme = useColorScheme();
        const colors = Colors[colorScheme ?? "light"];

        const [modalVisible, setModalVisible] = useState(false);

        const handlePress = () => {
                setModalVisible(true);
                onPress?.();
        };

        const closeModal = () => {
                setModalVisible(false);
        };

        const handleCreateRecipe = () => {
                closeModal();
                router.push("/recipe");
        };

        const handleLogWeightPress = () => {
                closeModal();
                router.push("/trackweight");
        };

        return (
                <>
                        <IconButton
                                icon="plus"
                                mode="contained-tonal"
                                containerColor={colors.tint}
                                style={{ alignSelf: "center" }}
                                size={24}
                                onPress={handlePress}
                        ></IconButton>

                        <AddModal isVisible={modalVisible} onClose={closeModal}>
                                <View style={styles.buttonContainer}>
                                        <AddModalPrimaryAction style={[styles.modalButton]}>
                                                <MaterialDesignIcons
                                                        name="food-variant"
                                                        color={colors.icon}
                                                        size={36}
                                                />
                                                <ThemedText
                                                        style={[styles.modalPrimaryActionButton, { color: colors.text }]}
                                                >
                                                        {localization.logFood}
                                                </ThemedText>
                                        </AddModalPrimaryAction>
                                        <AddModalPrimaryAction style={[styles.modalButton]}>
                                                <FontAwesome
                                                        name="barcode"
                                                        color={colors.icon}
                                                        size={36}
                                                />
                                                <ThemedText
                                                        style={[styles.modalPrimaryActionButton, { color: colors.text }]}
                                                >
                                                        {localization.scanBarcode}
                                                </ThemedText>
                                        </AddModalPrimaryAction>
                                        <AddModalPrimaryAction
                                                style={[styles.modalButton]}
                                                onPress={handleLogWeightPress}
                                        >
                                                <Ionicons
                                                        name="scale-outline"
                                                        color={colors.icon}
                                                        size={36}
                                                />
                                                <ThemedText
                                                        style={[styles.modalPrimaryActionButton, { color: colors.text }]}
                                                >
                                                        {localization.logWeight}
                                                </ThemedText>
                                        </AddModalPrimaryAction>
                                        <AddModalPrimaryAction style={[styles.modalButton]} onPress={handleCreateRecipe} >
                                                <MaterialIcons
                                                        name="set-meal"
                                                        color={colors.icon}
                                                        size={36}
                                                />
                                                <ThemedText
                                                        style={[styles.modalPrimaryActionButton, { color: colors.text }]}
                                                >
                                                        {localization.createRecipe}
                                                </ThemedText>
                                        </AddModalPrimaryAction>
                                </View>
                        </AddModal >
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
        modalPrimaryActionButton: {
                fontSize: 14,
                fontWeight: "bold",
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
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 10,
        },
        modalButton: {
                flex: 1,
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
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
