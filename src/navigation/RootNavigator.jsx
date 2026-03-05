import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import LoginScreen from '../screens/auth/LoginScreen';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    const { isAuthenticated, loading } = useAuth();
    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
                {!isAuthenticated
                    ? <Stack.Screen name="Login" component={LoginScreen} />
                    : <Stack.Screen name="Main" component={MainNavigator} />
                }
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loader: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
});
