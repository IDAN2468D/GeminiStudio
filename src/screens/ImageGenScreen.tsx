import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Dimensions, SafeAreaView, StatusBar, Modal } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useImageGenerator } from '../hooks/useImageGenerator';

const API_KEY = process.env.GEMINI_API_KEY || '';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ImageGenScreen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState('');

  const {
    generatedImages, loading, error, saveSuccess, caption,
    selectedFilter, setSelectedFilter, generateImages, shareImage, applyFilterStyle
  } = useImageGenerator(API_KEY);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:'#f0f4f8' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#4f46e5" />
      <ScrollView contentContainerStyle={{ flexGrow:1, paddingBottom:20 }} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <LinearGradient colors={['#4f46e5', '#2563EB']} style={{ width:SCREEN_WIDTH-40, flexDirection:'row', alignItems:'center', padding:10, borderRadius:15, marginHorizontal:20, marginTop:30, shadowColor:"#000", shadowOffset:{width:0,height:5}, shadowOpacity:0.3, shadowRadius:5, elevation:6 }}>
          <Icon name="image-outline" size={28} color="#fff" style={{ marginRight:10 }} />
          <Text style={{ fontSize:26, fontWeight:'bold', color:'#fff'}}>צור תמונה מטקסט</Text>
        </LinearGradient>

        {/* INPUT */}
        <View style={{ width:'90%', backgroundColor:'#fff', borderRadius:20, padding:20, marginTop:20, shadowColor:"#000", shadowOffset:{width:0,height:3}, shadowOpacity:0.1, shadowRadius:5, elevation:5, alignSelf:'center' }}>
          <TextInput
            style={{ width:'100%', borderWidth:1, borderColor:'#d1d5db', borderRadius:12, padding:15, fontSize:16, backgroundColor:'#f9fafb', textAlignVertical:'top', minHeight:100 }}
            placeholder="הכנס תיאור לתמונה..."
            placeholderTextColor="#999"
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />
          <TouchableOpacity style={{ backgroundColor:'#2563EB', padding:15, borderRadius:15, marginTop:10, alignItems:'center' }} onPress={()=>generateImages(prompt)} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color:'#fff', fontSize:18, fontWeight:'bold'}}>צור תמונה</Text>}
          </TouchableOpacity>
        </View>

        {error ? <Text style={{ color:'#ef4444', textAlign:'center', marginTop:10 }}>{error}</Text> : null}
        {saveSuccess ? <Text style={{ color:'#10b981', textAlign:'center', marginTop:10 }}>{caption}</Text> : null}

        {/* FILTERS */}
        <View style={{ flexDirection:'row', justifyContent:'center', marginTop:10 }}>
          {(['none','grayscale','sepia','blur'] as const).map(f=>(
            <TouchableOpacity key={f} onPress={()=>setSelectedFilter(f)} style={{ padding:8, backgroundColor:selectedFilter===f?'#2563EB':'#e2e8f0', marginHorizontal:5, borderRadius:10 }}>
              <Text style={{ color:selectedFilter===f?'#fff':'#000' }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* IMAGES GRID */}
        <View style={{ flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', marginTop:15, paddingHorizontal:20 }}>
          {generatedImages.map((uri, index)=>(
            <View key={index} style={{ width:(SCREEN_WIDTH-60)/2, marginBottom:20 }}>
              <TouchableOpacity onPress={()=>{setModalImage(uri); setModalVisible(true);}}>
                <Image source={{ uri }} style={[{ width:'100%', height:150, borderRadius:12 }, applyFilterStyle(selectedFilter)]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>shareImage(uri)} style={{ position:'absolute', bottom:5, right:5, backgroundColor:'#2563EB', paddingHorizontal:8, paddingVertical:4, borderRadius:8 }}>
                <Text style={{ color:'#fff', fontSize:12 }}>Share</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* MODAL ZOOM */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.9)', justifyContent:'center', alignItems:'center' }}>
            <TouchableOpacity style={{ position:'absolute', top:50, right:20 }} onPress={()=>setModalVisible(false)}>
              <Text style={{ color:'#fff', fontSize:20 }}>X</Text>
            </TouchableOpacity>
            <Image source={{ uri:modalImage }} style={{ width:'90%', height:'70%', borderRadius:15 }} resizeMode="contain"/>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
};

export default ImageGenScreen;