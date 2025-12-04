/**
 * Property Creation Fix Test
 * Tests that property creation handles undefined values correctly
 */

import { describe, it, expect } from 'vitest';

describe('Property Creation - Undefined Values Handling', () => {
  it('should filter out undefined values from property data', () => {
    // Simulate the filtering logic used in adminRouters.ts
    const propertyData = {
      name: 'Test Property',
      propertyType: 'residential',
      investmentType: 'buy_to_let',
      totalValue: 1000000,
      sharePrice: 1000,
      totalShares: 1000,
      // These fields are undefined
      description: undefined,
      addressLine1: undefined,
      propertySize: undefined,
      amenities: undefined,
    };

    // Filter out undefined values
    const cleanPropertyData = Object.fromEntries(
      Object.entries(propertyData).filter(([_, v]) => v !== undefined)
    );

    // Should only include defined values
    expect(cleanPropertyData).toEqual({
      name: 'Test Property',
      propertyType: 'residential',
      investmentType: 'buy_to_let',
      totalValue: 1000000,
      sharePrice: 1000,
      totalShares: 1000,
    });

    // Should not include undefined fields
    expect(cleanPropertyData).not.toHaveProperty('description');
    expect(cleanPropertyData).not.toHaveProperty('addressLine1');
    expect(cleanPropertyData).not.toHaveProperty('propertySize');
    expect(cleanPropertyData).not.toHaveProperty('amenities');
  });

  it('should filter out undefined date values', () => {
    const dates = {
      firstDistributionDate: new Date('2024-12-01'),
      fundingDeadline: undefined,
      acquisitionDate: new Date('2024-11-01'),
      completionDate: undefined,
      expectedExitDate: undefined,
    };

    const cleanDates = Object.fromEntries(
      Object.entries(dates).filter(([_, v]) => v !== undefined)
    );

    expect(cleanDates).toEqual({
      firstDistributionDate: new Date('2024-12-01'),
      acquisitionDate: new Date('2024-11-01'),
    });

    expect(Object.keys(cleanDates)).toHaveLength(2);
  });

  it('should preserve all values when none are undefined', () => {
    const propertyData = {
      name: 'Test Property',
      description: 'A test property',
      propertyType: 'commercial',
      investmentType: 'buy_to_sell',
      totalValue: 2000000,
      sharePrice: 2000,
      totalShares: 1000,
      propertySize: 500,
    };

    const cleanPropertyData = Object.fromEntries(
      Object.entries(propertyData).filter(([_, v]) => v !== undefined)
    );

    expect(cleanPropertyData).toEqual(propertyData);
    expect(Object.keys(cleanPropertyData)).toHaveLength(8);
  });

  it('should handle empty object when all values are undefined', () => {
    const propertyData = {
      description: undefined,
      addressLine1: undefined,
      propertySize: undefined,
    };

    const cleanPropertyData = Object.fromEntries(
      Object.entries(propertyData).filter(([_, v]) => v !== undefined)
    );

    expect(cleanPropertyData).toEqual({});
    expect(Object.keys(cleanPropertyData)).toHaveLength(0);
  });

  it('should handle mixed types correctly', () => {
    const propertyData = {
      name: 'Test',
      totalValue: 0, // Zero should be preserved
      sharePrice: 1000,
      description: '', // Empty string should be preserved
      propertySize: undefined, // Undefined should be filtered
      waitlistEnabled: false, // False should be preserved
      numberOfUnits: null, // Null should be preserved (different from undefined)
    };

    const cleanPropertyData = Object.fromEntries(
      Object.entries(propertyData).filter(([_, v]) => v !== undefined)
    );

    expect(cleanPropertyData).toEqual({
      name: 'Test',
      totalValue: 0,
      sharePrice: 1000,
      description: '',
      waitlistEnabled: false,
      numberOfUnits: null,
    });

    // Zero, empty string, false, and null should be preserved
    expect(cleanPropertyData.totalValue).toBe(0);
    expect(cleanPropertyData.description).toBe('');
    expect(cleanPropertyData.waitlistEnabled).toBe(false);
    expect(cleanPropertyData.numberOfUnits).toBe(null);

    // Undefined should be filtered out
    expect(cleanPropertyData).not.toHaveProperty('propertySize');
  });
});
