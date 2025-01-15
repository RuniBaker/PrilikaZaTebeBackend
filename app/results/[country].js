import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Linking, TouchableOpacity, Button } from "react-native";
import { useRouter, usePathname } from "expo-router";
import axios from "axios";

const ResultsScreen = () => {
  const router = useRouter();
  const pathname = usePathname();
  const country = pathname.split("/")[2]; // Extract "country" from the URL

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!country) {
          console.error("Country parameter is missing.");
          return;
        }
        const response = await axios.get(`http://192.168.3.156:3001/api/projects/${country}`);
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [country]);

  const handleOpenLink = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) => console.error("Failed to open URL:", err));
    } else {
      console.error("No URL provided.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading projects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Go Back Button */}
      <Button title="Go Back" onPress={() => router.push("/")} />

      <Text style={styles.title}>Projects for {country.toUpperCase()}</Text>

      <FlatList
        data={projects}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleOpenLink(item.url)} style={styles.projectItem}>
            <Text style={[styles.projectTitle]}>{item.title}</Text>
            <Text>{item.dates}</Text>
            <Text>{item.location}</Text>
            <Text>Deadline: {item.deadline}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  projectItem: {
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ResultsScreen;
