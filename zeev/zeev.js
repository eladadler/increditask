/* ===== zeev blessing book — data layer ===== */
(function(){
  const SB_URL = 'https://njlxjgjzutcketpapgud.supabase.co';
  const SB_KEY = 'sb_publishable_986UagaRBziCIqiSFqrNBg_rwZs0c56';
  const BUCKET = 'zeev-media';
  const TABLE  = 'zeev_blessings';
  const sb = window.supabase.createClient(SB_URL, SB_KEY);

  async function uploadMedia(file){
    const ext  = file.name.split('.').pop().toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { cacheControl:'3600' });
    if(error) throw error;
    return {
      url:  sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
      type: file.type.startsWith('video') ? 'video' : 'image'
    };
  }

  async function addBlessing({ name, message, file }){
    let media_url = null, media_type = null;
    if(file){ const m = await uploadMedia(file); media_url = m.url; media_type = m.type; }
    const { error } = await sb.from(TABLE).insert({ name, message: message||null, media_url, media_type });
    if(error) throw error;
  }

  async function loadBlessings(){
    const { data, error } = await sb.from(TABLE).select('*').order('created_at');
    if(error) throw error;
    return data;
  }

  async function deleteBlessing(id, mediaUrl){
    if(mediaUrl){
      try{
        const path = decodeURIComponent(mediaUrl.split('/zeev-media/')[1]);
        await sb.storage.from(BUCKET).remove([path]);
      }catch(e){ console.warn('media delete failed', e); }
    }
    const { error } = await sb.from(TABLE).delete().eq('id', id);
    if(error) throw error;
  }

  window.ZeevApp = { addBlessing, loadBlessings, deleteBlessing };
})();
