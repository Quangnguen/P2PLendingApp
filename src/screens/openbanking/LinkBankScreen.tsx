import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Button } from '@/components/common';
import { useAppDispatch, useOpenBanking, createLinkToken, useToast, useAppSelector } from '@/store';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { loadBanks } from '@/store/slices/openBankingSlice';
import { Bank } from '@/types';
import LinearGradient from 'react-native-linear-gradient';

type LinkBankScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LinkBank'>;
};

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_WIDTH = (width - 40) / COLUMN_COUNT;

const LinkBankScreen: React.FC<LinkBankScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const navigate = useNavigation<any>();

  useEffect(() => {
    dispatch(loadBanks());
  }, [dispatch]);

  const { banks, isLoading, error } = useAppSelector((state) => state.openBanking);

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBankSelect = (bank: Bank) => {
    navigate.navigate('VNLinkBank', { bank });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Liên kết ngân hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder }]}>
          <Ionicons name="search" size={20} color={colors.textGray} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textWhite }]}
            placeholder="Tìm kiếm ngân hàng..."
            placeholderTextColor={colors.textGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textGray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Popular Banks Label */}
        <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Ngân hàng phổ biến</Text>

        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Text style={{ color: colors.redError, textAlign: 'center' }}>{error}</Text>
          </View>
        ) : (
          <View style={styles.bankGrid}>
            {filteredBanks.map((bank) => (
              <TouchableOpacity
                key={bank.id}
                style={styles.bankItemContainer}
                onPress={() => handleBankSelect(bank)}
                activeOpacity={0.7}
              >
                <View style={[styles.bankLogoContainer, { backgroundColor: '#fff', shadowColor: colors.accentBlue }]}>
                  <Image
                    source={{ uri: bank.logo }}
                    style={styles.bankLogo}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.bankName, { color: colors.textWhite }]} numberOfLines={1}>{bank.shortName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {filteredBanks.length === 0 && !isLoading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={colors.textGray} />
            <Text style={[styles.emptyText, { color: colors.textGray }]}>
              Không tìm thấy ngân hàng nào
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 24,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  errorContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -8, // compensate for padding
  },
  bankItemContainer: {
    width: '33.33%', // 3 columns
    alignItems: 'center',
    padding: 8,
    marginBottom: 16,
  },
  bankLogoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    elevation: 4, // Android shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bankLogo: {
    width: '100%',
    height: '100%',
  },
  bankName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default LinkBankScreen;
