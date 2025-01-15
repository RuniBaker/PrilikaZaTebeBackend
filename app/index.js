import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const CountrySelectionScreen = () => {
  const router = useRouter();

  const handlePress = (country) => {
    router.push(`/results/${country}`); // Navigates to the dynamic route
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Odaberi Državu iz koje dolaziš:</Text>
      <TouchableOpacity style={styles.button} onPress={() => handlePress("bosnia")}>
        <Text style={styles.buttonText}>Bosna i Hercegovina</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => handlePress("serbia")}>
        <Text style={styles.buttonText}>Srbija</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => handlePress("croatia")}>
        <Text style={styles.buttonText}>Hrvatska</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => handlePress("montenegro")}>
        <Text style={styles.buttonText}>Crna Gora</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#89CFF0", // Blue color
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8, // Rounded corners
    marginVertical: 8, // Space between buttons
    width: "80%", // Adjust button width
    alignItems: "center", // Center the text horizontally
  },
  buttonText: {
    color: "#fff", // White text
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CountrySelectionScreen;
