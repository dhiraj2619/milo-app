import React from "react";
import {
    View,
    Text,
} from "react-native";
import globalStyles from "../../styles/globalStyle";



const HomeScreen = () => {
    return (
        <View style={globalStyles.container}>
            <Text style={globalStyles.title}>
                Welcome to MILO
            </Text>

            <Text style={globalStyles.subtitle}>
                Meet. Talk. Connect.
            </Text>
        </View>
    );
};


export default HomeScreen;