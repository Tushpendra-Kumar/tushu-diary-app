import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { ArrowLeft, Users, Plus, Trash2 } from 'lucide-react-native';
import { C } from '../../../constants/theme';import ParticleBackground from '../../../components/ParticleBackground';


const MOCK_FAMILIES = [
  { id: 'f1', name: 'Doe Family', members: ['John Doe', 'Jane Doe', 'Jimmy Doe'] },
  { id: 'f2', name: 'Smith Family', members: ['Will Smith', 'Jada Smith'] },
];

export default function AdminFamilyManagementScreen({ navigation }) {
  const [families, setFamilies] = useState(MOCK_FAMILIES);

  const removeFamily = (id) => {
    setFamilies(families.filter(f => f.id !== id));
  };

  const renderItem = ({ item }) => (
    <View style={s.familyCard}>
      <View style={s.cardHeader}>
        <View style={s.titleRow}>
          <Users size={20} color={C.gold} />
          <Text style={s.familyName}>{item.name}</Text>
        </View>
        <TouchableOpacity onPress={() => removeFamily(item.id)}>
          <Trash2 size={20} color={C.textSecondary || '#888'} />
        </TouchableOpacity>
      </View>
      <View style={s.membersList}>
        {item.members.map((m, i) => (
          <Text key={i} style={s.memberName}>â€¢ {m}</Text>
        ))}
      </View>
      <TouchableOpacity style={s.addMemberBtn}>
        <Plus size={16} color={C.white} />
        <Text style={s.addMemberText}>Add Connection</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <ParticleBackground />
      
      <FlatList
        data={families}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.listContent}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06080D' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border || '#333' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.white, marginLeft: 16 },
  listContent: { padding: 20 },
  familyCard: { backgroundColor: '#111', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: C.border || '#333' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  familyName: { fontSize: 16, color: C.white, fontWeight: '700', marginLeft: 8 },
  membersList: { marginBottom: 16 },
  memberName: { fontSize: 14, color: C.textSecondary || '#aaa', marginBottom: 4, marginLeft: 4 },
  addMemberBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, backgroundColor: '#222' },
  addMemberText: { color: C.white, fontSize: 14, fontWeight: '600', marginLeft: 8 },
});

