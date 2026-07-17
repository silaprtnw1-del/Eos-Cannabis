/**
 * Internationalisation (i18n) for PHANNAPHA GACP Farm Manager
 *
 * Simple bilingual TH/EN system. Screens call `useTranslation(isTh)`
 * and reference keys via `t('login_title')` instead of inline strings.
 */
import { useCallback } from 'react';

// ─── Translation Dictionary ────────────────────────────────────────────────
// Keys are organised by screen / feature area.

const translations = {
  // ── Common ──────────────────────────────────────────────────────────────
  save: { th: 'บันทึก', en: 'Save' },
  cancel: { th: 'ยกเลิก', en: 'Cancel' },
  loading: { th: 'กำลังโหลด...', en: 'Loading...' },
  error: { th: 'เกิดข้อผิดพลาด', en: 'Error' },
  refresh: { th: 'รีเฟรช 🔄', en: 'Refresh 🔄' },
  confirm: { th: 'ยืนยัน', en: 'Confirm' },
  delete: { th: 'ลบ', en: 'Delete' },
  edit: { th: 'แก้ไข', en: 'Edit' },
  close: { th: 'ปิด', en: 'Close' },
  back: { th: 'กลับ', en: 'Back' },
  retry: { th: 'ลองใหม่', en: 'Retry' },
  no_data: { th: 'ไม่มีข้อมูล', en: 'No Data' },

  // ── Tab Bar ─────────────────────────────────────────────────────────────
  tab_dashboard: { th: 'แดชบอร์ด', en: 'Dashboard' },
  tab_nutrients: { th: 'น้ำปุ๋ย', en: 'Nutrients' },
  tab_plants: { th: 'ต้นกัญชา', en: 'Plants' },
  tab_inventory: { th: 'คลังสายพันธุ์', en: 'Inventory' },
  tab_mother_plants: { th: 'ต้นแม่พันธุ์', en: 'Mother Plants' },
  tab_sop: { th: 'งาน SOP', en: 'SOP Tasks' },
  tab_vpd: { th: 'ค่า VPD', en: 'VPD Calc' },

  // ── Login Screen ────────────────────────────────────────────────────────
  login_brand: { th: 'ระบบบริหารจัดการฟาร์มมาตรฐาน GACP', en: 'SOP & GACP Compliance System' },
  login_title: { th: 'เข้าสู่ระบบปฏิบัติการ (GACP Auth)', en: 'Operator Portal Sign In' },
  login_email_label: { th: 'อีเมลพนักงาน (Email)', en: 'Operator Email' },
  login_password_label: { th: 'รหัสผ่าน (Password)', en: 'Password' },
  login_submit: { th: 'ยืนยันเข้าสู่ระบบ', en: 'Sign In' },
  login_fill_fields: { th: 'กรุณากรอกข้อมูลให้ครบถ้วน', en: 'Please fill in all fields' },
  login_auth_error: { th: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', en: 'Authentication Error' },
  login_restricted: {
    th: '🔒 ระบบปิดลงทะเบียนสาธารณะ: กรุณาติดต่อหัวหน้างานหรือผู้ดูแลระบบเพื่อเปิดสิทธิ์ผู้ใช้งานใหม่',
    en: '🔒 Restricted Access: Self-signup is disabled. Contact your supervisor to register operator credentials.',
  },

  // ── Dashboard ───────────────────────────────────────────────────────────
  dash_clones: { th: 'กิ่งชำ (Clones)', en: 'Active Clones' },
  dash_veg: { th: 'ต้นทำใบ (Veg)', en: 'Active Veg' },
  dash_flower: { th: 'ต้นทำดอก (Flower)', en: 'Active Flower' },
  dash_gacp_rate: { th: 'อัตรา GACP', en: 'GACP Rate' },
  dash_tasks_cleared: { th: 'งานผ่าน', en: 'Cleared' },
  dash_compliance_title: { th: 'ความคืบหน้าสุขอนามัย GACP ของวันนี้', en: "Today's GACP Compliance" },
  dash_compliant: { th: 'ผ่านเกณฑ์สุขอนามัยประจำวันแล้ว', en: 'GACP Compliant. Good job!' },
  dash_remaining: { th: 'ยังมีงาน SOP คงค้างที่ต้องเคลียร์วันนี้', en: 'SOP tasks remaining.' },
  dash_open_checklist: { th: 'เปิดใบเช็คลิสต์ SOP ➡️', en: 'Open Checklist Form ➡️' },
  dash_climate_title: { th: 'สภาพแวดล้อมห้องปลูกล่าสุด', en: 'Live Room Climate' },
  dash_nutrients_shortcut: { th: 'จ่ายน้ำปุ๋ย & Runoff', en: 'Nutrients & Runoff' },
  dash_plants_shortcut: { th: 'คลังพืช & สแกนย้ายห้อง', en: 'Plants & Transfers' },

  // ── Nutrient Logs ───────────────────────────────────────────────────────
  nutrient_water_volume: { th: 'ปริมาณน้ำ (ลิตร)', en: 'Water Volume (L)' },
  nutrient_ph_in: { th: 'pH เข้า', en: 'pH In' },
  nutrient_ec_in: { th: 'EC เข้า', en: 'EC In' },
  nutrient_ph_out: { th: 'pH ออก (Runoff)', en: 'pH Out (Runoff)' },
  nutrient_ec_out: { th: 'EC ออก (Runoff)', en: 'EC Out (Runoff)' },
  nutrient_log_title: { th: 'บันทึกน้ำปุ๋ย', en: 'Nutrient Log' },
  nutrient_history: { th: 'ประวัติบันทึก', en: 'Log History' },
  nutri_grow_room: { th: 'ห้องที่กรอกน้ำปุ๋ย', en: 'Grow Room' },
  nutri_batches_rooms: { th: 'เลือกชุดปลูกและห้อง', en: 'Batch & Grow Room Selection' },
  nutri_active_batch: { th: 'รุ่นเพาะปลูก (Batch)', en: 'Active Batch' },
  nutri_irrigation_target: { th: 'กรอกข้อมูลน้ำและเป้าหมายปุ๋ย', en: 'Irrigation & PPM Target' },
  nutri_target_ppm: { th: 'ค่า PPM เป้าหมาย (500 scale)', en: 'Target PPM (500 scale)' },
  nutri_ph_in_label: { th: 'ค่า pH ขาเข้า', en: 'pH Input' },
  nutri_water_volume_label: { th: 'ปริมาตรถังผสมน้ำ (ลิตร)', en: 'Water Volume (Liters)' },
  nutri_active_ferts: { th: 'เลือกชนิดปุ๋ยที่ต้องการตวง', en: 'Select Active Fertilizers' },
  nutri_dosing_result: { th: 'ผลลัพธ์การตวงแม่ปุ๋ย (ml)', en: 'Dosing Result (ml)' },
  nutri_runoff_panel: { th: 'บันทึกค่าน้ำไหลทิ้ง (Runoff Logs)', en: 'Runoff Input Panel' },
  nutri_runoff_vol: { th: 'ปริมาตรน้ำไหลทิ้ง (ลิตร)', en: 'Runoff Volume (Liters)' },
  nutri_ph_out_label: { th: 'ค่า pH ขาออก', en: 'pH Out' },
  nutri_ec_out_label: { th: 'ค่า EC ขาออก', en: 'EC Out' },
  nutri_notes: { th: 'บันทึกเพิ่มเติม', en: 'Notes / Remarks' },
  nutri_save_btn: { th: '💾 บันทึกประวัติน้ำปุ๋ยและ Runoff', en: '💾 Save Irrigation & Runoff Log' },
  nutri_calmag_warn_title: { th: '⚠️ GACP Safety Alert: CalMag High Rate', en: '⚠️ GACP Safety Alert: CalMag High Rate' },
  nutri_calmag_warn_desc: { th: 'อัตราคำนวณ CalMag สูงกว่าเกณฑ์ปกติของ SOP (2-3 mL/gal) แนะนำให้ปิดใช้งานระบบตวงอัตโนมัติแล้วเปลี่ยนไปตวงมือแยกต่างหากคงที่ 2.0 mL/gal', en: 'Calculated CalMag rate exceeds the GACP safety limit (5 mL/gal). Disable CalMag dosing, and mix manually at the SOP rate of 2.0 mL/gal.' },
  nutri_runoff_alert_title: { th: '🚨 Runoff Values Out of Range!', en: '🚨 Runoff Values Out of Range!' },
  nutri_runoff_alert_desc: { th: 'ตรวจพบสภาพน้ำทิ้งผิดปกติ! ค่ากรดด่างหลุดเป้าหมาย (5.5 - 6.5) หรือปุ๋ยสะสมสูง แนะนำให้ทำการล้างรากวัสดุปลูก (Flush) ในวันถัดไป', en: 'Runoff pH is outside target GACP range (5.5 - 6.5) or salt buildup is high. A flush is recommended tomorrow.' },

  // ── Plant Directory ─────────────────────────────────────────────────────
  plant_all: { th: 'ทั้งหมด', en: 'All' },
  plant_clone: { th: 'กิ่งชำ', en: 'Clone' },
  plant_veg: { th: 'ทำใบ', en: 'Veg' },
  plant_flower: { th: 'ทำดอก', en: 'Flower' },
  plant_harvested: { th: 'เก็บเกี่ยว', en: 'Harvested' },
  plant_transfer: { th: 'ย้ายห้อง', en: 'Transfer' },
  plant_strain: { th: 'สายพันธุ์', en: 'Strain' },
  plant_room: { th: 'ห้อง', en: 'Room' },
  plant_planted_date: { th: 'วันปลูก', en: 'Planted Date' },
  plant_register_clones: { th: 'ลงทะเบียนกิ่งชำใหม่ (Register Clones)', en: 'Register Clones' },
  plant_import_plants: { th: 'นำเข้าต้นไม้เข้าระบบ (Import)', en: 'Import Plants' },
  plant_add_room: { th: 'เพิ่มห้องปลูกใหม่ (Add Room)', en: 'Create Grow Room' },

  // ── Strain Inventory ────────────────────────────────────────────────────
  inv_search_placeholder: { th: 'ค้นหาชื่อสายพันธุ์...', en: 'Search strain name...' },
  inv_strain_count_label: { th: 'จำนวนสายพันธุ์', en: 'Strains' },
  inv_empty_farm: { th: 'ยังไม่มีต้นไม้ในฟาร์ม กรุณาลงทะเบียนกิ่งชำหรือนำเข้าต้นไม้ก่อน', en: 'No plants registered in the farm yet. Register clones or import plants to get started.' },
  inv_no_match: { th: 'ไม่พบสายพันธุ์ที่ค้นหา', en: 'No strain matches your search' },
  plant_scan_btn: { th: '📷 สแกนตรวจสอบ / ย้ายพืช', en: '📷 Scan QR/Barcode' },
  plant_strain_name: { th: 'ชื่อสายพันธุ์ (Strain Name)', en: 'Strain Name' },
  plant_strain_placeholder: { th: 'เช่น Super Buff Cherry', en: 'e.g. Super Buff Cherry' },
  plant_clone_qty: { th: 'จำนวนกิ่งชำ (Quantity)', en: 'Quantity of Clones (e.g. 50)' },
  plant_initial_room: { th: 'ห้องเริ่มต้น', en: 'Initial Room' },
  plant_strain_acronym: { th: 'อักษรย่อสายพันธุ์ (Acronym)', en: 'Strain Acronym (for ID prefixes)' },
  plant_acronym_placeholder: { th: 'เช่น SBC', en: 'e.g. SBC' },
  plant_source: { th: 'แหล่งที่มาของต้น', en: 'Propagation Source' },
  plant_source_purchased_clone: { th: 'กิ่งชำจากแหล่งอื่น', en: 'Purchased Clone' },
  plant_source_seed_grown: { th: 'เพาะเมล็ดเอง', en: 'Grown from Seed' },
  plant_mode_new_batch: { th: 'ชุดต้นใหม่ (New Batch)', en: 'New Batch' },
  plant_mode_existing_batch: { th: 'ชุดต้นที่มีอยู่ (Existing Batch)', en: 'Existing Batch' },
  plant_submit_register: { th: '💾 ลงทะเบียนกิ่งชำ & สร้างรหัสบาร์โค้ด', en: '💾 Register Clones & Gen QR labels' },
  plant_import_qty: { th: 'จำนวนที่นำเข้า', en: 'Import Qty' },
  plant_import_from: { th: 'นำเข้าจากประวัติตระกูล (Batch ID)', en: 'Import Source (Batch ID)' },
  plant_submit_import: { th: '💾 บันทึกนำเข้าต้นไม้', en: '💾 Import Plants & Gen QR labels' },
  plant_archive_failed_clone: { th: 'เก็บถาวร (กิ่งชำไม่รอด)', en: 'Archive (Failed Clone)' },
  plant_archive_other: { th: 'เก็บถาวร (อื่นๆ)', en: 'Archive (Other)' },

  // ── Mother Plants ────────────────────────────────────────────────────────
  mother_register_title: { th: 'ลงทะเบียนต้นแม่พันธุ์', en: 'Register Mother Plant' },
  mother_strain_name: { th: 'ชื่อสายพันธุ์', en: 'Strain Name' },
  mother_strain_acronym: { th: 'อักษรย่อสายพันธุ์ (Acronym)', en: 'Strain Acronym' },
  mother_notes: { th: 'บันทึกเพิ่มเติม (ถ้ามี)', en: 'Notes (optional)' },
  mother_notes_placeholder: { th: 'เช่น แหล่งที่มา อายุ ฯลฯ', en: 'e.g. source, age, etc.' },
  mother_submit_register: { th: '💾 ลงทะเบียนต้นแม่พันธุ์', en: '💾 Register Mother Plant' },
  mother_registered: { th: 'ลงทะเบียนต้นแม่พันธุ์สำเร็จ', en: 'Mother plant registered successfully' },
  mother_select_optional: { th: 'เลือกต้นแม่พันธุ์ (ถ้ามี)', en: 'Select Mother (optional)' },
  mother_no_mother: { th: 'ไม่ระบุต้นแม่พันธุ์', en: 'No Mother' },
  mother_stats_total_clones: { th: 'กิ่งชำทั้งหมด', en: 'Total Clones' },
  mother_stats_failed: { th: 'กิ่งชำไม่รอด', en: 'Failed' },
  mother_stats_success_rate: { th: 'อัตราความสำเร็จ', en: 'Success Rate' },
  plant_new_room_name: { th: 'ชื่อห้องใหม่', en: 'New Room Name' },
  plant_room_type: { th: 'ประเภทห้องปลูก', en: 'Room Operational Type' },
  plant_submit_room: { th: '💾 บันทึกการสร้างห้อง', en: '💾 Register Room' },
  plant_loading_plants: { th: 'กำลังโหลดบัญชีพืชของฟาร์ม...', en: 'Loading Plant Registry...' },
  plant_print_simulated: { th: 'พิมพ์รหัส QR สำเร็จสำหรับพืชรหัส:', en: 'QR Label print task simulated for plant:' },
  plant_print_failed: { th: 'การพิมพ์ฉลากล้มเหลว', en: 'Print failed' },
  plant_registered: { th: 'ลงทะเบียนต้นกล้ากิ่งชำสำเร็จแล้ว', en: 'Plants registered successfully!' },
  plant_import_success: { th: 'นำเข้าต้นกัญชาเข้าระบบสำเร็จแล้ว', en: 'Plants imported successfully!' },
  plant_room_created: { th: 'ลงทะเบียนห้องปลูกใหม่สำเร็จแล้ว', en: 'Room created successfully!' },
  plant_transferred: { th: 'ย้ายสถานที่และบันทึกประวัติสำเร็จแล้ว', en: 'Plant transferred successfully!' },
  plant_unauthorized: { th: '❌ คุณไม่มีสิทธิ์ทำรายการย้าย (สิทธิ์เฉพาะ Supervisor/Admin)', en: 'Only Supervisors and Admins are authorized to perform transfers.' },
  permission_denied: { th: '❌ คุณไม่มีสิทธิ์ทำรายการนี้', en: 'You are not authorized to perform this action.' },
  plant_search_placeholder: { th: 'ค้นหาด้วยรหัส Plant ID หรือสายพันธุ์...', en: 'Search by Plant ID or Strain...' },

  // ── SOP / Checklist ─────────────────────────────────────────────────────
  sop_today: { th: 'เช็คลิสต์วันนี้', en: "Today's Checklist" },
  sop_history: { th: 'ประวัติ', en: 'History' },
  sop_pest_incident: { th: 'พบศัตรูพืช?', en: 'Pest Incident?' },
  sop_incident_details: { th: 'รายละเอียดศัตรูพืช', en: 'Incident Details' },
  sop_corrective_action: { th: 'แนวทางแก้ไข', en: 'Corrective Action' },
  sop_submit: { th: 'บันทึกเช็คลิสต์', en: 'Submit Checklist' },
  sop_tasks_checklist: { th: 'เช็คลิสต์ GACP / SOP สุขอนามัยฟาร์ม', en: 'GACP Daily Hygiene Checklist' },
  sop_critical_controls: { th: 'รายงานควบคุมสิ่งผิดปกติ (Critical Controls)', en: 'Pest & Pathogen Control' },
  sop_staff_mgmt: { th: 'จัดการพนักงาน', en: 'Staff Mgmt' },
  sop_daily_checklist: { th: 'เช็คลิสต์ประจำวัน', en: 'Daily Checklist' },
  sop_compliance_history: { th: 'บันทึกประวัติฟาร์ม', en: 'Compliance History' },
  sop_pest_alert: { th: '⚠️ ตรวจพบแมลงศัตรูพืช หรือเชื้อราแป้งในวันนี้', en: '⚠️ Pest or Mold Incident Detected Today' },
  sop_pest_desc: { th: 'รายละเอียดปัญหา (เช่น ไรแดง, ราแป้ง ในห้อง Flower 1)', en: 'Incident Details (e.g. Red Mites)' },
  sop_corrective: { th: 'มาตรการแก้ไข (เช่น พ่นสารชีวภัณฑ์บิวเวอเรีย)', en: 'Corrective Action Taken' },
  sop_submit_gacp: { th: '💾 บันทึกใบเช็คลิสต์ SOP ประจำวัน', en: '💾 Submit GACP Checklist' },
  sop_export_csv: { th: '📊 ดาวน์โหลดข้อมูลสุขอนามัย (.CSV)', en: '📊 Export GACP Log (.CSV)' },
  sop_hygiene_trail: { th: 'ประวัติสุขอนามัย GACP', en: 'GACP Hygiene Audit Trail' },
  sop_irri_runoff_logs: { th: 'ประวัติการบันทึกน้ำปุ๋ย & Runoff', en: 'Irrigation & Runoff Logs' },
  sop_register_operator: { th: 'ลงทะเบียนพนักงานปฏิบัติการใหม่ (GACP Operator SignUp)', en: 'Register New GACP Operator' },
  sop_operator_fullname: { th: 'ชื่อ-นามสกุลพนักงาน (Full Name)', en: 'Full Name' },
  sop_operator_email: { th: 'อีเมลพนักงานสำหรับใช้ล็อกอิน (Email)', en: 'Operator Email' },
  sop_operator_pwd: { th: 'รหัสผ่านแรกเข้า (Password)', en: 'Password' },
  sop_operator_role: { th: 'บทบาทหน้าที่ในระบบ (Role - RBAC)', en: 'Operational Role (RBAC)' },
  sop_confirm_register: { th: '➕ ยืนยันการสมัครและส่งประวัติพนักงาน', en: '➕ Confirm Operator Registration' },
  sop_registering: { th: 'กำลังลงทะเบียน...', en: 'Registering...' },
  sop_register_success: { th: 'ลงทะเบียนพนักงานสำเร็จ', en: 'Operator Registered Successfully' },
  sop_register_failed: { th: 'การลงทะเบียนล้มเหลว', en: 'Registration Failed' },
  sop_csv_exported: { th: 'ดาวน์โหลดไฟล์รายงานสุขอนามัย GACP ประจำสัปดาห์ลงเครื่องมือถือของคุณแล้ว', en: 'GACP Hygiene compliance report has been downloaded to your device.' },

  // ── VPD Calculator ──────────────────────────────────────────────────────
  vpd_temperature: { th: 'อุณหภูมิ (°C)', en: 'Temperature (°C)' },
  vpd_humidity: { th: 'ความชื้น (%RH)', en: 'Humidity (%RH)' },
  vpd_result: { th: 'ค่า VPD', en: 'VPD Value' },
  vpd_optimal: { th: 'อยู่ในช่วงที่เหมาะสม', en: 'Optimal Range' },
  vpd_too_low: { th: 'ต่ำเกินไป', en: 'Too Low' },
  vpd_too_high: { th: 'สูงเกินไป', en: 'Too High' },
  vpd_celsius: { th: 'เซลเซียส (°C)', en: 'Celsius (°C)' },
  vpd_fahrenheit: { th: 'วาเรนไฮต์ (°F)', en: 'Fahrenheit (°F)' },
  vpd_leaf_vpd: { th: 'ค่า VPD ใบพืช', en: 'Calculated Leaf VPD' },
  vpd_room_temp: { th: 'อุณหภูมิห้องปลูก', en: 'Room Temp' },
  vpd_humidity_rh: { th: 'ความชื้นสัมพัทธ์ (RH)', en: 'Humidity (RH)' },
  vpd_offset: { th: 'ส่วนต่างอุณหภูมิใบ (Offset)', en: 'Leaf Temp Offset' },
  vpd_breakdown: { th: 'ค่าวิเคราะห์เพิ่มเติม', en: 'Telemetry Breakdown' },
  vpd_leaf_temp: { th: 'อุณหภูมิผิวใบพืช:', en: 'Calculated Leaf Temp:' },
  vpd_svp_leaf: { th: 'ความดันไอน้ำอิ่มตัวใบ (SVP Leaf):', en: 'SVP Leaf:' },
  vpd_avp_air: { th: 'ความดันไอน้ำอากาศ (AVP Air):', en: 'AVP Air:' },
  vpd_set_env: { th: 'ตั้งค่าพารามิเตอร์สิ่งแวดล้อม', en: 'Environmental Parameters' },
  
  // VPD Statuses
  vpd_status_too_wet: { th: 'เสี่ยงราน้ำค้าง/ชื้นเกินไป', en: 'Danger: Too Wet / PM Risk' },
  vpd_status_too_wet_desc: { th: 'ควรเพิ่มอุณหภูมิห้อง หรือเปิดเครื่องลดความชื้นด่วนเพื่อป้องการเกิดราน้ำค้างและเชื้อรา', en: 'Increase room temp or run dehumidifiers to prevent Powdery Mildew and mold.' },
  vpd_status_clone: { th: 'กิ่งชำ / รากเริ่มงอก (Clone)', en: 'Clone / Rooting Phase' },
  vpd_status_clone_desc: { th: 'ค่านี้เหมาะสำหรับระยะทำราก (Clone) และต้นกล้าที่ต้องการความชื้นสูง', en: 'Ideal range for rooting clones and early seedlings needing high humidity.' },
  vpd_status_veg: { th: 'ระยะทำใบ (Vegetative)', en: 'Vegetative Stage' },
  vpd_status_veg_desc: { th: 'ค่าเหมาะสมสำหรับการเติบโตในระยะทำใบ ช่วยให้พืชสังเคราะห์แสงได้ดีที่สุด', en: 'Optimal range for healthy vegetative growth and photosynthesis.' },
  vpd_status_bloom: { th: 'ระยะทำดอก (Bloom)', en: 'Bloom Stage' },
  vpd_status_bloom_desc: { th: 'ระดับเหมาะสมสำหรับระยะทำดอก ช่วยกระตุ้นการสร้างเรซิ่นและป้องกันดอกเน่า', en: 'Optimal range for flower production, resin development, and avoiding bud rot.' },
  vpd_status_too_dry: { th: 'เสี่ยงใบแห้ง/แล้งเกินไป', en: 'Danger: Too Dry' },
  vpd_status_too_dry_desc: { th: 'ปากใบพืชอาจปิดตัวเนื่องจากสูญเสียน้ำเร็วเกินไป ควรเพิ่มความชื้นด่วน', en: 'Stomata will close due to excessive transpiration. Add humidity immediately.' },

  // ── Saved Status ────────────────────────────────────────────────────────
  saved_success: { th: 'บันทึกเรียบร้อย! ✓', en: 'Saved Successfully! ✓' },
  saved_failed: { th: 'บันทึกล้มเหลว', en: 'Save Failed' },

  // ── Connection / Error ──────────────────────────────────────────────────
  connection_error: { th: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', en: 'Connection Error' },
  empty_list: { th: 'ยังไม่มีรายการ', en: 'No items yet' },
} as const;

// ─── Types ──────────────────────────────────────────────────────────────────

export type TranslationKey = keyof typeof translations;

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Returns a translation function `t(key)` bound to the current language.
 *
 * @param isTh - `true` for Thai, `false` for English
 *
 * @example
 * ```tsx
 * const { t } = useTranslation(isTh);
 * return <Text>{t('login_title')}</Text>;
 * ```
 */
export function useTranslation(isTh: boolean) {
  const t = useCallback(
    (key: TranslationKey): string => {
      const entry = translations[key];
      return isTh ? entry.th : entry.en;
    },
    [isTh],
  );

  return { t };
}

export default translations;
