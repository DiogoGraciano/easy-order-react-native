import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
  textColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  backgroundColor = '#007AFF',
  textColor = '#fff',
}) => {
  return (
    <View style={[styles.metricCard, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.metricSubtitle, { color: textColor }]}>
          {title}
        </Text>
        <Text style={[styles.metricValue, { color: textColor }]}>
          {value}
        </Text>
      </View>
      <View style={styles.metricContent}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={icon} 
            size={32} 
            color={textColor} 
            style={styles.icon}
          />
        </View>
        {subtitle && (
          <Text style={[styles.subtitle, { color: textColor }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  metricCard: {
    minHeight: 120,
    margin: 8,
    flex: 1,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 12,
  },
  metricSubtitle: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  metricValue: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
  },
  metricContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  iconContainer: {
    alignSelf: 'flex-end',
  },
  icon: {
    opacity: 0.7,
  },
  subtitle: {
    fontSize: 10,
    opacity: 0.7,
  },
}); 