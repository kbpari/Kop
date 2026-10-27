-- Database sudah diterapkan ke proyek Supabase wlwfhelhaeiltnqfnzjd.
-- File ini mendokumentasikan kebijakan akses tahap awal.
-- Admin pertama harus ditunjuk melalui SQL Editor oleh pemilik proyek.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.petugas p
  WHERE p.auth_user_id = (SELECT auth.uid())
    AND p.aktif AND p.peran = 'admin'
) $$;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
CREATE POLICY staff_own_profile ON public.petugas FOR SELECT TO authenticated USING (auth_user_id = (SELECT auth.uid()));
CREATE POLICY admin_manage_staff ON public.petugas FOR ALL TO authenticated USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY admin_read_settings ON public.pengaturan_koperasi FOR SELECT TO authenticated USING ((SELECT private.is_admin()));
CREATE POLICY admin_read_anggota ON public.anggota FOR SELECT TO authenticated USING ((SELECT private.is_admin()));
CREATE POLICY admin_insert_anggota ON public.anggota FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY admin_update_anggota ON public.anggota FOR UPDATE TO authenticated USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['transaksi_simpanan','pengajuan_pinjaman','pinjaman','jadwal_angsuran','pembayaran_angsuran','transaksi_kas','akun_akuntansi','jurnal','jurnal_detail','whatsapp_logs','audit_logs'] LOOP
    EXECUTE format('CREATE POLICY admin_read ON public.%I FOR SELECT TO authenticated USING ((SELECT private.is_admin()))',t);
  END LOOP;
END $$;
