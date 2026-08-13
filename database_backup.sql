--
-- PostgreSQL database dump
--

\restrict BDZYCrZmSn5wD0pRP8vxc1wbaQWETSPY41CDSiA9PXRvWew2e1Yum41uGR3gKLz

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE public.cache OWNER TO postgres;

--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE public.cache_locks OWNER TO postgres;

--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection character varying(255) NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.failed_jobs OWNER TO postgres;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.failed_jobs_id_seq OWNER TO postgres;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: hasil_assessment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hasil_assessment (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    jawaban_detail jsonb NOT NULL,
    total_skor integer DEFAULT 0 NOT NULL,
    skor_maksimal integer DEFAULT 0 NOT NULL,
    status character varying(255) NOT NULL,
    passing_grade integer DEFAULT 70 NOT NULL,
    completed_at timestamp(0) without time zone NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT hasil_assessment_status_check CHECK (((status)::text = ANY ((ARRAY['LULUS'::character varying, 'TIDAK_LULUS'::character varying])::text[])))
);


ALTER TABLE public.hasil_assessment OWNER TO postgres;

--
-- Name: hasil_assessment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hasil_assessment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hasil_assessment_id_seq OWNER TO postgres;

--
-- Name: hasil_assessment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hasil_assessment_id_seq OWNED BY public.hasil_assessment.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


ALTER TABLE public.job_batches OWNER TO postgres;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: konfigurasi_sistem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.konfigurasi_sistem (
    id bigint NOT NULL,
    kunci character varying(255) NOT NULL,
    nilai text NOT NULL,
    deskripsi character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.konfigurasi_sistem OWNER TO postgres;

--
-- Name: konfigurasi_sistem_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.konfigurasi_sistem_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.konfigurasi_sistem_id_seq OWNER TO postgres;

--
-- Name: konfigurasi_sistem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.konfigurasi_sistem_id_seq OWNED BY public.konfigurasi_sistem.id;


--
-- Name: laporan_opd_tujuan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.laporan_opd_tujuan (
    id bigint NOT NULL,
    laporan_id bigint NOT NULL,
    opd_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    selesai_at timestamp(0) without time zone
);


ALTER TABLE public.laporan_opd_tujuan OWNER TO postgres;

--
-- Name: laporan_opd_tujuan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laporan_opd_tujuan_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laporan_opd_tujuan_id_seq OWNER TO postgres;

--
-- Name: laporan_opd_tujuan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laporan_opd_tujuan_id_seq OWNED BY public.laporan_opd_tujuan.id;


--
-- Name: laporan_wawancara; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.laporan_wawancara (
    id bigint NOT NULL,
    kode_laporan character varying(255) NOT NULL,
    user_id bigint NOT NULL,
    opd_tujuan_id bigint,
    latitude numeric(10,8),
    longitude numeric(11,8),
    alamat_laporan character varying(255),
    kelurahan character varying(255),
    kecamatan character varying(255),
    dokumentasi_foto jsonb,
    catatan_observasi text,
    jawaban_wawancara_detail jsonb,
    skor_akhir integer DEFAULT 0 NOT NULL,
    skor_maksimal integer DEFAULT 0 NOT NULL,
    kesimpulan_otomatis character varying(255),
    kategori_urusan character varying(255),
    alasan_routing text,
    status_laporan character varying(255) DEFAULT 'DRAFT'::character varying NOT NULL,
    submitted_at timestamp(0) without time zone,
    deadline_selesai timestamp(0) without time zone,
    status_sla character varying(255) DEFAULT 'ON_TIME'::character varying NOT NULL,
    eskalasi_dikirim boolean DEFAULT false NOT NULL,
    poin_kegiatan integer,
    catatan_guru text,
    verifikator_id bigint,
    verified_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT laporan_wawancara_status_laporan_check CHECK (((status_laporan)::text = ANY ((ARRAY['DRAFT'::character varying, 'MENUNGGU_VERIFIKASI_GURU'::character varying, 'TERVERIFIKASI'::character varying, 'AUTO_ROUTED'::character varying, 'DALAM_PENANGANAN'::character varying, 'DILIMPAHKAN'::character varying, 'KOLABORASI'::character varying, 'SELESAI'::character varying, 'DITOLAK'::character varying])::text[]))),
    CONSTRAINT laporan_wawancara_status_sla_check CHECK (((status_sla)::text = ANY ((ARRAY['ON_TIME'::character varying, 'OVERDUE'::character varying])::text[])))
);


ALTER TABLE public.laporan_wawancara OWNER TO postgres;

--
-- Name: laporan_wawancara_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laporan_wawancara_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laporan_wawancara_id_seq OWNER TO postgres;

--
-- Name: laporan_wawancara_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laporan_wawancara_id_seq OWNED BY public.laporan_wawancara.id;


--
-- Name: log_keamanan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.log_keamanan (
    id bigint NOT NULL,
    ip_address character varying(45) NOT NULL,
    user_agent character varying(255),
    status character varying(255) NOT NULL,
    endpoint character varying(255) NOT NULL,
    metode character varying(10) DEFAULT 'GET'::character varying NOT NULL,
    http_code integer,
    detail text,
    diakses_pada timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT log_keamanan_status_check CHECK (((status)::text = ANY ((ARRAY['BLOCKED_WAF'::character varying, 'RATE_LIMITED'::character varying, 'ALLOWED'::character varying])::text[])))
);


ALTER TABLE public.log_keamanan OWNER TO postgres;

--
-- Name: log_keamanan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.log_keamanan_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.log_keamanan_id_seq OWNER TO postgres;

--
-- Name: log_keamanan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.log_keamanan_id_seq OWNED BY public.log_keamanan.id;


--
-- Name: log_tindak_lanjut; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.log_tindak_lanjut (
    id bigint NOT NULL,
    laporan_id bigint NOT NULL,
    user_id bigint NOT NULL,
    aksi character varying(255) NOT NULL,
    keterangan text,
    opd_limpah_id bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    opd_id bigint,
    CONSTRAINT log_tindak_lanjut_aksi_check CHECK (((aksi)::text = ANY ((ARRAY['PROSES'::character varying, 'LIMPAHKAN'::character varying, 'KOLABORASI'::character varying, 'SELESAI'::character varying, 'TOLAK'::character varying, 'ESKALASI'::character varying, 'CATATAN'::character varying])::text[])))
);


ALTER TABLE public.log_tindak_lanjut OWNER TO postgres;

--
-- Name: log_tindak_lanjut_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.log_tindak_lanjut_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.log_tindak_lanjut_id_seq OWNER TO postgres;

--
-- Name: log_tindak_lanjut_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.log_tindak_lanjut_id_seq OWNED BY public.log_tindak_lanjut.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: opd; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.opd (
    id bigint NOT NULL,
    nama character varying(255) NOT NULL,
    singkatan character varying(255),
    email character varying(255),
    telepon character varying(255),
    kategori_urusan character varying(255),
    aktif boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.opd OWNER TO postgres;

--
-- Name: opd_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.opd_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.opd_id_seq OWNER TO postgres;

--
-- Name: opd_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.opd_id_seq OWNED BY public.opd.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: pertanyaan_kuesioner; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pertanyaan_kuesioner (
    id bigint NOT NULL,
    teks_pertanyaan text NOT NULL,
    jenis character varying(255) NOT NULL,
    kategori character varying(255),
    bobot_nilai integer DEFAULT 1 NOT NULL,
    opsi_jawaban json,
    aktif boolean DEFAULT true NOT NULL,
    urutan integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT pertanyaan_kuesioner_jenis_check CHECK (((jenis)::text = ANY ((ARRAY['SELF_ASSESSMENT'::character varying, 'WAWANCARA'::character varying])::text[])))
);


ALTER TABLE public.pertanyaan_kuesioner OWNER TO postgres;

--
-- Name: pertanyaan_kuesioner_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pertanyaan_kuesioner_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pertanyaan_kuesioner_id_seq OWNER TO postgres;

--
-- Name: pertanyaan_kuesioner_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pertanyaan_kuesioner_id_seq OWNED BY public.pertanyaan_kuesioner.id;


--
-- Name: sekolah; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sekolah (
    id bigint NOT NULL,
    nama character varying(255) NOT NULL,
    npsn character varying(255),
    alamat character varying(255),
    kecamatan character varying(255),
    aktif boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.sekolah OWNER TO postgres;

--
-- Name: sekolah_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sekolah_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sekolah_id_seq OWNER TO postgres;

--
-- Name: sekolah_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sekolah_id_seq OWNED BY public.sekolah.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255),
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    google_id character varying(255),
    avatar character varying(255),
    nis character varying(20),
    telepon character varying(255),
    alamat text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    role character varying(255) DEFAULT 'masyarakat'::character varying NOT NULL,
    sekolah_id bigint,
    opd_id bigint,
    profil_lengkap boolean DEFAULT false NOT NULL,
    kelas character varying(255),
    status_kelayakan character varying(255) DEFAULT 'BELUM'::character varying NOT NULL,
    kelayakan_at timestamp(0) without time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'siswa'::character varying, 'masyarakat'::character varying, 'guru'::character varying, 'opd'::character varying])::text[]))),
    CONSTRAINT users_status_kelayakan_check CHECK (((status_kelayakan)::text = ANY ((ARRAY['BELUM'::character varying, 'LULUS'::character varying, 'TIDAK_LULUS'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: hasil_assessment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hasil_assessment ALTER COLUMN id SET DEFAULT nextval('public.hasil_assessment_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: konfigurasi_sistem id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.konfigurasi_sistem ALTER COLUMN id SET DEFAULT nextval('public.konfigurasi_sistem_id_seq'::regclass);


--
-- Name: laporan_opd_tujuan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan_opd_tujuan ALTER COLUMN id SET DEFAULT nextval('public.laporan_opd_tujuan_id_seq'::regclass);


--
-- Name: laporan_wawancara id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan_wawancara ALTER COLUMN id SET DEFAULT nextval('public.laporan_wawancara_id_seq'::regclass);


--
-- Name: log_keamanan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_keamanan ALTER COLUMN id SET DEFAULT nextval('public.log_keamanan_id_seq'::regclass);


--
-- Name: log_tindak_lanjut id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_tindak_lanjut ALTER COLUMN id SET DEFAULT nextval('public.log_tindak_lanjut_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: opd id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd ALTER COLUMN id SET DEFAULT nextval('public.opd_id_seq'::regclass);


--
-- Name: pertanyaan_kuesioner id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pertanyaan_kuesioner ALTER COLUMN id SET DEFAULT nextval('public.pertanyaan_kuesioner_id_seq'::regclass);


--
-- Name: sekolah id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sekolah ALTER COLUMN id SET DEFAULT nextval('public.sekolah_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: cache; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cache (key, value, expiration) FROM stdin;
\.


--
-- Data for Name: cache_locks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cache_locks (key, owner, expiration) FROM stdin;
\.


--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.failed_jobs (id, uuid, connection, queue, payload, exception, failed_at) FROM stdin;
\.


--
-- Data for Name: hasil_assessment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hasil_assessment (id, user_id, jawaban_detail, total_skor, skor_maksimal, status, passing_grade, completed_at, created_at, updated_at) FROM stdin;
1	8	[{"nilai": 4, "bobot_max": 4, "pertanyaan_id": 1}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 2}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 3}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 4}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 5}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 6}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 7}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 8}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 9}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 10}]	40	40	LULUS	90	2026-06-03 05:23:21	2026-06-03 05:23:21	2026-06-03 05:23:21
2	9	[{"nilai": 4, "bobot_max": 4, "pertanyaan_id": 1}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 2}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 3}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 4}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 5}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 6}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 7}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 8}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 9}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 10}]	40	40	LULUS	90	2026-06-03 07:04:09	2026-06-03 07:04:09	2026-06-03 07:04:09
3	9	[{"nilai": 4, "bobot_max": 4, "pertanyaan_id": 1}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 2}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 3}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 4}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 5}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 6}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 7}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 8}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 9}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 10}]	40	40	LULUS	90	2026-06-03 07:04:30	2026-06-03 07:04:30	2026-06-03 07:04:30
4	9	[{"nilai": 4, "bobot_max": 4, "pertanyaan_id": 1}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 2}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 3}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 4}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 5}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 6}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 7}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 8}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 9}, {"nilai": 4, "bobot_max": 4, "pertanyaan_id": 10}]	40	40	LULUS	90	2026-06-03 07:21:07	2026-06-03 07:21:07	2026-06-03 07:21:07
\.


--
-- Data for Name: job_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_batches (id, name, total_jobs, pending_jobs, failed_jobs, failed_job_ids, options, cancelled_at, created_at, finished_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (id, queue, payload, attempts, reserved_at, available_at, created_at) FROM stdin;
\.


--
-- Data for Name: konfigurasi_sistem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.konfigurasi_sistem (id, kunci, nilai, deskripsi, created_at, updated_at) FROM stdin;
1	self_assessment_passing_grade	90	Passing grade Self-Assessment (persentase 0-100)	2026-06-03 03:31:53	2026-06-03 03:31:53
2	max_ulang_assessment	3	Maksimum pengulangan Self-Assessment per hari	2026-06-03 03:31:53	2026-06-03 03:31:53
3	sla_jam	168	SLA penanganan laporan dalam jam (7x24 = 168)	2026-06-03 03:31:53	2026-06-03 03:31:53
4	nama_aplikasi	Tengok Tetangga	Nama aplikasi	2026-06-03 03:31:53	2026-06-03 03:31:53
5	versi_aplikasi	1.0.0	Versi aplikasi	2026-06-03 03:31:53	2026-06-03 03:31:53
\.


--
-- Data for Name: laporan_opd_tujuan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laporan_opd_tujuan (id, laporan_id, opd_id, created_at, updated_at, selesai_at) FROM stdin;
2	2	2	2026-06-03 03:31:53	2026-06-03 03:31:53	\N
3	3	2	2026-06-03 03:31:53	2026-06-03 03:31:53	\N
4	3	4	2026-06-03 03:31:53	2026-06-03 03:31:53	\N
5	3	5	2026-06-03 03:31:53	2026-06-03 03:31:53	\N
13	7	3	2026-06-03 07:22:34	2026-06-03 07:22:34	\N
14	7	2	2026-06-03 07:22:34	2026-06-03 07:22:34	\N
15	7	4	2026-06-03 07:22:34	2026-06-03 07:22:34	\N
1	1	2	2026-06-03 03:31:53	2026-06-03 07:34:02	2026-06-03 07:34:02
\.


--
-- Data for Name: laporan_wawancara; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laporan_wawancara (id, kode_laporan, user_id, opd_tujuan_id, latitude, longitude, alamat_laporan, kelurahan, kecamatan, dokumentasi_foto, catatan_observasi, jawaban_wawancara_detail, skor_akhir, skor_maksimal, kesimpulan_otomatis, kategori_urusan, alasan_routing, status_laporan, submitted_at, deadline_selesai, status_sla, eskalasi_dikirim, poin_kegiatan, catatan_guru, verifikator_id, verified_at, created_at, updated_at) FROM stdin;
2	TT-20260526-0001	10	2	0.14567800	117.49123400	Jl. R.E. Martadinata No.5, Loktuan	Loktuan	Bontang Utara	\N	Anak yatim piatu piatu terlantar yang memerlukan bantuan sosial tunai dari Dinsos.	\N	1	5	KASUS_TUNGGAL	EKONOMI	\N	SELESAI	2026-05-26 09:00:00	\N	ON_TIME	f	\N	\N	\N	2026-05-26 17:00:00	2026-06-03 03:31:53	2026-06-03 03:31:53
3	TT-20260525-0003	10	2	0.12500000	117.46000000	Jl. Bhayangkara, Gunung Elai	Gunung Elai	Bontang Utara	\N	Keluarga rentan dengan atap rumah bocor dan anak putus sekolah memerlukan bantuan terpadu.	\N	1	5	KASUS_RENTAN	EKONOMI	\N	SELESAI	2026-05-25 11:00:00	\N	ON_TIME	f	\N	\N	\N	2026-05-25 18:00:00	2026-06-03 03:31:53	2026-06-03 03:31:53
6	TT-20260603-0001	8	\N	0.07026306	117.44739562	Jl. Bessai Berinta No 1	Bontang Lestari	Bontang Selatan	["http://localhost:8080/storage/observasi/2026/06/03/4d433a17-8ebe-481b-a385-fb6526a0d743.png"]	\N	{"kondisi": [{"label": "Lansia tinggal sendiri", "keterangan": null}, {"label": "Berpenghasilan rendah", "keterangan": null}, {"label": "Tidak memiliki penghasilan tetap", "keterangan": null}, {"label": "Sakit/berpenyakit menahun", "keterangan": null}, {"label": "Keluarga yang tinggal di rumah tidak layak huni (RTLH)", "keterangan": null}], "nama_tetangga": "Arif Rahman"}	5	13	Kasus_Kompleks	KESEHATAN	\N	MENUNGGU_VERIFIKASI_GURU	2026-06-03 05:27:05	2026-06-10 05:27:05	ON_TIME	f	\N	\N	\N	\N	2026-06-03 05:27:05	2026-06-03 05:27:05
7	TT-20260603-0002	9	3	0.13376975	117.50428650	Jl. Pierre Tendean No 50	Bontang Kuala	Bontang Utara	["http://localhost:8080/storage/observasi/2026/06/03/c4543d1c-b3f2-44bd-b639-e4b2bc255003.png"]	\N	{"kondisi": [{"label": "Berpenghasilan rendah", "keterangan": null}, {"label": "Terdapat ibu hamil yang kurang mampu atau memerlukan pemeriksaan rutin", "keterangan": null}, {"label": "Keluarga yang tinggal di rumah tidak layak huni (RTLH)", "keterangan": null}], "nama_tetangga": "Wahyuni"}	3	13	Kasus_Rentan	KESEHATAN	Routing berdasarkan kondisi → Dinas Kesehatan, Dinas Sosial, Dinas Perumahan & Permukiman	AUTO_ROUTED	2026-06-03 07:22:34	2026-06-05 07:22:34	ON_TIME	f	\N	\N	\N	\N	2026-06-03 07:22:34	2026-06-03 07:22:34
1	TT-20260526-0002	10	2	0.13333300	117.48333300	Jl. Awang Long No.12, Bontang Baru	Bontang Baru	Bontang Utara	\N	Ditemukan lansia kurang mampu memerlukan jaminan sosial dari dinas sosial di Kelurahan Bontang Baru.	\N	1	5	KASUS_RENTAN	EKONOMI	\N	SELESAI	2026-05-26 10:00:00	\N	ON_TIME	f	\N	\N	\N	\N	2026-06-03 03:31:53	2026-06-03 07:34:02
\.


--
-- Data for Name: log_keamanan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.log_keamanan (id, ip_address, user_agent, status, endpoint, metode, http_code, detail, diakses_pada) FROM stdin;
\.


--
-- Data for Name: log_tindak_lanjut; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.log_tindak_lanjut (id, laporan_id, user_id, aksi, keterangan, opd_limpah_id, created_at, updated_at, opd_id) FROM stdin;
1	1	2	SELESAI	kami daftarkan dalam BPJS biaya pemerintah	\N	2026-06-03 07:34:02	2026-06-03 07:34:02	2
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000000_create_users_table	1
2	0001_01_01_000001_create_cache_table	1
3	0001_01_01_000002_create_jobs_table	1
4	2024_01_01_000001_create_sekolah_opd_table	1
5	2024_01_01_000002_extend_users_table	1
6	2024_01_01_000003_create_kuesioner_tables	1
7	2024_01_01_000004_create_laporan_tables	1
8	2026_05_22_000001_reset_assessment_for_warga	1
9	2026_05_22_000002_update_seed_user_passwords	1
10	2026_05_23_000001_fix_profil_lengkap_for_opd_guru_admin	1
11	2026_05_23_000002_sync_sekolah_bontang	1
12	2026_05_23_122429_create_laporan_opd_tujuan_table	1
13	2026_05_25_000001_add_dp3akb_opd	1
14	2026_05_25_000002_add_selesai_at_and_opd_id_to_tindaklanjut	1
15	2026_05_25_000003_replace_kuesioner_with_actual_questions	1
\.


--
-- Data for Name: opd; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.opd (id, nama, singkatan, email, telepon, kategori_urusan, aktif, created_at, updated_at) FROM stdin;
1	Dinas Pemberdayaan Perempuan, Perlindungan Anak dan Keluarga Berencana	DP3AKB	dp3akb@bontang.go.id	\N	SOSIAL	t	2026-06-03 03:31:51	2026-06-03 03:31:51
2	Dinas Sosial	Dinsos	dinsos@bontang.go.id	\N	EKONOMI	t	2026-06-03 03:31:51	2026-06-03 03:31:51
3	Dinas Kesehatan	Dinkes	dinkes@bontang.go.id	\N	KESEHATAN	t	2026-06-03 03:31:51	2026-06-03 03:31:51
4	Dinas Perumahan & Permukiman	Disperkim	disperkim@bontang.go.id	\N	PERMUKIMAN	t	2026-06-03 03:31:51	2026-06-03 03:31:51
5	Dinas Pendidikan	Disdik	disdik@bontang.go.id	\N	PENDIDIKAN	t	2026-06-03 03:31:51	2026-06-03 03:31:51
6	BPBD	BPBD	bpbd@bontang.go.id	\N	UMUM	t	2026-06-03 03:31:51	2026-06-03 03:31:51
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (email, token, created_at) FROM stdin;
\.


--
-- Data for Name: pertanyaan_kuesioner; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pertanyaan_kuesioner (id, teks_pertanyaan, jenis, kategori, bobot_nilai, opsi_jawaban, aktif, urutan, created_at, updated_at) FROM stdin;
1	Apakah Anda merasa hubungan Anda dengan tetangga di lingkungan sekitar sudah baik?	SELF_ASSESSMENT	\N	4	[{"teks":"Sangat baik","nilai":4},{"teks":"Cukup baik","nilai":3},{"teks":"Kurang baik","nilai":2},{"teks":"Tidak baik sama sekali","nilai":1}]	t	1	2026-06-03 03:31:51	2026-06-03 03:31:51
2	Seberapa sering Anda berbicara atau berinteraksi dengan tetangga sekitar?	SELF_ASSESSMENT	\N	4	[{"teks":"Sangat sering","nilai":4},{"teks":"Kadang-kadang","nilai":3},{"teks":"Jarang","nilai":2},{"teks":"Tidak pernah","nilai":1}]	t	2	2026-06-03 03:31:51	2026-06-03 03:31:51
3	Apakah Anda mengetahui apakah ada tetangga yang membutuhkan bantuan di lingkungan Anda?	SELF_ASSESSMENT	\N	4	[{"teks":"Ya, saya tahu banyak yang membutuhkan","nilai":4},{"teks":"Ya, saya tahu beberapa yang membutuhkan","nilai":3},{"teks":"Tidak banyak yang membutuhkan","nilai":2},{"teks":"Tidak tahu sama sekali","nilai":1}]	t	3	2026-06-03 03:31:51	2026-06-03 03:31:51
4	Apakah Anda merasa penting untuk membantu tetangga yang membutuhkan?	SELF_ASSESSMENT	\N	4	[{"teks":"Sangat penting","nilai":4},{"teks":"Cukup penting","nilai":3},{"teks":"Tidak terlalu penting","nilai":2},{"teks":"Tidak penting sama sekali","nilai":1}]	t	4	2026-06-03 03:31:51	2026-06-03 03:31:51
5	Apa bentuk bantuan yang paling sering Anda berikan kepada tetangga yang membutuhkan?	SELF_ASSESSMENT	\N	4	[{"teks":"Membantu pekerjaan rumah tangga","nilai":4},{"teks":"Memberikan informasi atau dukungan moral","nilai":3},{"teks":"Membantu dalam keadaan darurat","nilai":2},{"teks":"Tidak pernah memberikan bantuan","nilai":1}]	t	5	2026-06-03 03:31:51	2026-06-03 03:31:51
6	Apakah Anda bersedia untuk berpartisipasi dalam kegiatan sosial seperti gotong royong bersama tetangga?	SELF_ASSESSMENT	\N	4	[{"teks":"Sangat bersedia","nilai":4},{"teks":"Bersedia","nilai":3},{"teks":"Kurang bersedia","nilai":2},{"teks":"Tidak bersedia","nilai":1}]	t	6	2026-06-03 03:31:51	2026-06-03 03:31:51
7	Apakah Anda tahu kondisi kesehatan atau kesejahteraan tetangga Anda yang membutuhkan perhatian khusus?	SELF_ASSESSMENT	\N	4	[{"teks":"Ya, saya tahu dengan baik","nilai":4},{"teks":"Cukup tahu","nilai":3},{"teks":"Hanya sedikit tahu","nilai":2},{"teks":"Tidak tahu sama sekali","nilai":1}]	t	7	2026-06-03 03:31:51	2026-06-03 03:31:51
8	Menurut Anda, apa yang dapat dilakukan untuk mempererat hubungan dengan tetangga yang kurang dikenal?	SELF_ASSESSMENT	\N	4	[{"teks":"Mengadakan acara silaturahmi atau kegiatan bersama","nilai":4},{"teks":"Membantu mereka yang sedang membutuhkan","nilai":3},{"teks":"Berbicara dan lebih mengenal satu sama lain","nilai":2},{"teks":"Tidak tahu, tidak ada cara yang perlu dilakukan","nilai":1}]	t	8	2026-06-03 03:31:51	2026-06-03 03:31:51
9	Apa manfaat utama yang Anda lihat dari saling membantu antar tetangga di lingkungan Anda?	SELF_ASSESSMENT	\N	4	[{"teks":"Meningkatkan rasa persaudaraan dan kebersamaan","nilai":4},{"teks":"Menciptakan lingkungan yang lebih harmonis","nilai":3},{"teks":"Membantu mengurangi kesulitan yang dialami tetangga","nilai":2},{"teks":"Semua jawaban di atas benar","nilai":4}]	t	9	2026-06-03 03:31:51	2026-06-03 03:31:51
10	Jika ada program atau kegiatan yang mendukung saling membantu antar tetangga, apakah Anda akan berpartisipasi?	SELF_ASSESSMENT	\N	4	[{"teks":"Pasti akan berpartisipasi","nilai":4},{"teks":"Mungkin akan berpartisipasi","nilai":3},{"teks":"Tidak yakin","nilai":2},{"teks":"Tidak akan berpartisipasi","nilai":1}]	t	10	2026-06-03 03:31:51	2026-06-03 03:31:51
11	Lansia tinggal sendiri	WAWANCARA	EKONOMI	1	[{"teks":"Ya","nilai":1,"opd":"Dinsos","opd_detail":"Urusan Jaminan Sosial \\/ Lansia Terlantar"}]	t	1	2026-06-03 03:31:51	2026-06-03 03:31:51
12	Memiliki anggota keluarga dengan disabilitas	WAWANCARA	EKONOMI	1	[{"teks":"Ya","nilai":1,"opd":"Dinsos","opd_detail":"Rehabilitasi Sosial"}]	t	2	2026-06-03 03:31:51	2026-06-03 03:31:51
13	Berpenghasilan rendah	WAWANCARA	EKONOMI	1	[{"teks":"Ya","nilai":1,"opd":"Dinsos","opd_detail":"Kesejahteraan Sosial - DTKS \\/ Bansos"}]	t	3	2026-06-03 03:31:51	2026-06-03 03:31:51
14	Tidak memiliki penghasilan tetap	WAWANCARA	EKONOMI	1	[{"teks":"Ya","nilai":1,"opd":"Dinsos","opd_detail":"Bansos"}]	t	4	2026-06-03 03:31:51	2026-06-03 03:31:51
15	Anak yatim/piatu	WAWANCARA	EKONOMI	1	[{"teks":"Ya","nilai":1,"opd":"Dinsos","opd_detail":"Urusan Anak Terlantar \\/ Panti Asuhan"}]	t	5	2026-06-03 03:31:51	2026-06-03 03:31:51
16	Keluarga yang terisolasi secara sosial (tidak memiliki hubungan baik dengan lingkungan sekitar)	WAWANCARA	EKONOMI	1	[{"teks":"Ya","nilai":1,"opd":"Dinsos","opd_detail":"Pekerja Sosial"}]	t	6	2026-06-03 03:31:51	2026-06-03 03:31:51
17	Sakit/berpenyakit menahun	WAWANCARA	KESEHATAN	1	[{"teks":"Ya","nilai":1,"opd":"Dinkes","opd_detail":"Puskesmas setempat \\/ Home Care"}]	t	7	2026-06-03 03:31:51	2026-06-03 03:31:51
18	Memiliki anggota keluarga yang sakit kronis/menahun dan membutuhkan perawatan rutin	WAWANCARA	KESEHATAN	1	[{"teks":"Ya","nilai":1,"opd":"Dinkes","opd_detail":"Fasilitasi rujukan \\/ BPJS PBI"}]	t	8	2026-06-03 03:31:51	2026-06-03 03:31:51
19	Memiliki anggota keluarga dengan gangguan jiwa (ODGJ)	WAWANCARA	KESEHATAN	1	[{"teks":"Ya","nilai":1,"opd":"Dinkes","opd_detail":"Penanganan medis psikiatri"}]	t	9	2026-06-03 03:31:51	2026-06-03 03:31:51
20	Keluarga dengan riwayat kekerasan dalam rumah tangga (KDRT)	WAWANCARA	SOSIAL	1	[{"teks":"Ya","nilai":1,"opd":"DP3AKB","opd_detail":"Perlindungan Perempuan dan Anak"}]	t	10	2026-06-03 03:31:51	2026-06-03 03:31:51
21	Keluarga dengan jumlah anggota tanggungan banyak dan penghasilan tidak mencukupi	WAWANCARA	EKONOMI	1	[{"teks":"Ya","nilai":1,"opd":"Dinsos","opd_detail":"Bantuan ekonomi"}]	t	11	2026-06-03 03:31:51	2026-06-03 03:31:51
22	Keluarga yang tinggal di rumah tidak layak huni (RTLH)	WAWANCARA	PERMUKIMAN	1	[{"teks":"Ya","nilai":1,"opd":"Disperkim","opd_detail":"Bedah Rumah dan Rusunawa"}]	t	12	2026-06-03 03:31:51	2026-06-03 03:31:51
23	Anak-anak putus sekolah karena keterbatasan biaya	WAWANCARA	PENDIDIKAN	1	[{"teks":"Ya","nilai":1,"opd":"Disdik","opd_detail":"Program Kejar Paket atau Beasiswa \\/ Bantuan Seragam"}]	t	13	2026-06-03 03:31:51	2026-06-03 03:31:51
24	Terdapat ibu hamil yang kurang mampu atau memerlukan pemeriksaan rutin	WAWANCARA	KESEHATAN	1	[{"teks":"Ya","nilai":1,"opd":"Dinkes","opd_detail":"Kesehatan Ibu & Anak \\/ Puskesmas"}]	t	14	2026-06-03 03:31:51	2026-06-03 03:31:51
\.


--
-- Data for Name: sekolah; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sekolah (id, nama, npsn, alamat, kecamatan, aktif, created_at, updated_at) FROM stdin;
1	SMA Negeri 1 Bontang	30400001	\N	Bontang Utara	t	2026-06-03 03:31:51	2026-06-03 03:31:51
2	SMA Negeri 2 Bontang	30400002	\N	Bontang Selatan	t	2026-06-03 03:31:51	2026-06-03 03:31:51
3	SMA Negeri 3 Bontang	30400006	\N	Bontang Barat	t	2026-06-03 03:31:51	2026-06-03 03:31:51
4	SMK Negeri 1 Bontang	30400003	\N	Bontang Barat	t	2026-06-03 03:31:51	2026-06-03 03:31:51
5	MAN Bontang	30400004	\N	Bontang Utara	t	2026-06-03 03:31:51	2026-06-03 03:31:51
6	SMA YPK Bontang	30400007	\N	Bontang Utara	t	2026-06-03 03:31:51	2026-06-03 03:31:51
7	SMA YPVDP Bontang	30400008	\N	Bontang Barat	t	2026-06-03 03:31:51	2026-06-03 03:31:51
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, ip_address, user_agent, payload, last_activity) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, email_verified_at, password, remember_token, created_at, updated_at, google_id, avatar, nis, telepon, alamat, latitude, longitude, role, sekolah_id, opd_id, profil_lengkap, kelas, status_kelayakan, kelayakan_at) FROM stdin;
1	Administrator	admin@tengoktetangga.id	2026-06-03 03:31:51	$2y$12$TzzXgvaHvPUEaxxHtQdDHe0vkzMMqLKz.IUVYUmRUuWiyWn2/WZfm	\N	2026-06-03 03:31:51	2026-06-03 03:31:51	\N	\N	\N	\N	\N	\N	\N	admin	\N	\N	t	\N	LULUS	\N
2	Petugas Dinas Sosial	dinsos@tengoktetangga.id	2026-06-03 03:31:51	$2y$12$aH2HX7Uo5zFlpOx.sROju.VBsKPeu6kljtYvaDOBqtekKkdD7lOG.	\N	2026-06-03 03:31:51	2026-06-03 03:31:51	\N	\N	\N	\N	\N	\N	\N	opd	\N	2	t	\N	BELUM	\N
3	Petugas Dinas Kesehatan	dinkes@tengoktetangga.id	2026-06-03 03:31:51	$2y$12$z/SMh1eU5axg7smb1kmwRuKPqiJxVNAT93H0V0106/eV48dpNGyS6	\N	2026-06-03 03:31:51	2026-06-03 03:31:51	\N	\N	\N	\N	\N	\N	\N	opd	\N	3	t	\N	BELUM	\N
4	Petugas Dinas Perumahan & Perkim	disperkim@tengoktetangga.id	2026-06-03 03:31:52	$2y$12$0jq0FzNKV0qr.ld5dXoUb./XB5MhZXErzo5bsKJe52Vg89iMANwYe	\N	2026-06-03 03:31:52	2026-06-03 03:31:52	\N	\N	\N	\N	\N	\N	\N	opd	\N	4	t	\N	BELUM	\N
5	Petugas Dinas Pendidikan	disdik@tengoktetangga.id	2026-06-03 03:31:52	$2y$12$.Ff6sM4.WjZE5f.dmkfrgOao1rDXDqE6OLk9yxXV3u4CFCfn6CqrO	\N	2026-06-03 03:31:52	2026-06-03 03:31:52	\N	\N	\N	\N	\N	\N	\N	opd	\N	5	t	\N	BELUM	\N
6	Petugas DP3AKB	dp3akb@tengoktetangga.id	2026-06-03 03:31:52	$2y$12$R98o2WtI1U.adnA7jRXMi.jxrb/wo8zu/dgT6cNGeTcanGorvReg2	\N	2026-06-03 03:31:52	2026-06-03 03:31:52	\N	\N	\N	\N	\N	\N	\N	opd	\N	1	t	\N	BELUM	\N
7	Budi Santoso, S.Pd	guru@tengoktetangga.id	2026-06-03 03:31:52	$2y$12$I142iqWT6NQwz8vLo5hgROS89QBw27lSbnyqdxlPJ7o4HNyFqdocK	\N	2026-06-03 03:31:52	2026-06-03 03:31:52	\N	\N	\N	\N	\N	\N	\N	guru	1	\N	t	\N	BELUM	\N
10	Diskominfo Kota Bontang	diskominfo@bontangkota.go.id	2026-06-03 03:31:53	$2y$12$hAeiQiM0KkNxkcv9jJ1qZeFVwaFnq91soOdzrugLvA4orDT3JHKEK	\N	2026-06-03 03:31:53	2026-06-03 03:31:53	\N	\N	\N	\N	\N	\N	\N	masyarakat	\N	\N	t	\N	LULUS	\N
8	Anisa Putri	siswa@tengoktetangga.id	2026-06-03 03:31:52	$2y$12$24mazxtWtURKPii42sXL1uBL27adp22KYYfq5I64Bw27DezC8i78e	\N	2026-06-03 03:31:52	2026-06-03 05:23:21	\N	\N	202410101	081234567890	Jl. Awang Long No.12, Bontang Baru	0.13333300	117.48333300	siswa	1	\N	t	XII IPS 1	LULUS	2026-06-03 05:23:21
11	Diskominfo Kota Bontang	diskominfobontang01@gmail.com	2026-06-03 05:28:13	\N	\N	2026-06-03 05:28:13	2026-06-03 05:28:13	108920835195406801865	https://lh3.googleusercontent.com/a/ACg8ocLfi6dbisFMvN7tCGZ2yzb6qdx0jxs2zYxJRoTsavMGkxQWB1o=s96-c	\N	\N	\N	\N	\N	masyarakat	\N	\N	f	\N	BELUM	\N
9	Siti Rahayu	warga@tengoktetangga.id	2026-06-03 03:31:53	$2y$12$Nutl/llLbMrHWy4bsUPSU.shgQvixud5zfYTFrk/pPOoIGpTGh.z6	\N	2026-06-03 03:31:53	2026-06-03 07:21:07	\N	\N	\N	082345678901	Jl. R.E. Martadinata No.5, Loktuan	0.14567800	117.49123400	masyarakat	\N	\N	t	\N	LULUS	2026-06-03 07:21:07
\.


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.failed_jobs_id_seq', 1, false);


--
-- Name: hasil_assessment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hasil_assessment_id_seq', 4, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: konfigurasi_sistem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.konfigurasi_sistem_id_seq', 5, true);


--
-- Name: laporan_opd_tujuan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.laporan_opd_tujuan_id_seq', 15, true);


--
-- Name: laporan_wawancara_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.laporan_wawancara_id_seq', 7, true);


--
-- Name: log_keamanan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.log_keamanan_id_seq', 1, false);


--
-- Name: log_tindak_lanjut_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.log_tindak_lanjut_id_seq', 1, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 15, true);


--
-- Name: opd_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.opd_id_seq', 6, true);


--
-- Name: pertanyaan_kuesioner_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pertanyaan_kuesioner_id_seq', 24, true);


--
-- Name: sekolah_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sekolah_id_seq', 7, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 11, true);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: hasil_assessment hasil_assessment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hasil_assessment
    ADD CONSTRAINT hasil_assessment_pkey PRIMARY KEY (id);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: konfigurasi_sistem konfigurasi_sistem_kunci_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.konfigurasi_sistem
    ADD CONSTRAINT konfigurasi_sistem_kunci_unique UNIQUE (kunci);


--
-- Name: konfigurasi_sistem konfigurasi_sistem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.konfigurasi_sistem
    ADD CONSTRAINT konfigurasi_sistem_pkey PRIMARY KEY (id);


--
-- Name: laporan_opd_tujuan laporan_opd_tujuan_laporan_id_opd_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan_opd_tujuan
    ADD CONSTRAINT laporan_opd_tujuan_laporan_id_opd_id_unique UNIQUE (laporan_id, opd_id);


--
-- Name: laporan_opd_tujuan laporan_opd_tujuan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan_opd_tujuan
    ADD CONSTRAINT laporan_opd_tujuan_pkey PRIMARY KEY (id);


--
-- Name: laporan_wawancara laporan_wawancara_kode_laporan_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan_wawancara
    ADD CONSTRAINT laporan_wawancara_kode_laporan_unique UNIQUE (kode_laporan);


--
-- Name: laporan_wawancara laporan_wawancara_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan_wawancara
    ADD CONSTRAINT laporan_wawancara_pkey PRIMARY KEY (id);


--
-- Name: log_keamanan log_keamanan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_keamanan
    ADD CONSTRAINT log_keamanan_pkey PRIMARY KEY (id);


--
-- Name: log_tindak_lanjut log_tindak_lanjut_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_tindak_lanjut
    ADD CONSTRAINT log_tindak_lanjut_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: opd opd_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd
    ADD CONSTRAINT opd_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: pertanyaan_kuesioner pertanyaan_kuesioner_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pertanyaan_kuesioner
    ADD CONSTRAINT pertanyaan_kuesioner_pkey PRIMARY KEY (id);


--
-- Name: sekolah sekolah_npsn_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sekolah
    ADD CONSTRAINT sekolah_npsn_unique UNIQUE (npsn);


--
-- Name: sekolah sekolah_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sekolah
    ADD CONSTRAINT sekolah_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_google_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_unique UNIQUE (google_id);


--
-- Name: users users_nis_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_nis_unique UNIQUE (nis);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: cache_expiration_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);


--
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);


--
-- Name: failed_jobs_connection_queue_failed_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX failed_jobs_connection_queue_failed_at_index ON public.failed_jobs USING btree (connection, queue, failed_at);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: laporan_wawancara_latitude_longitude_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX laporan_wawancara_latitude_longitude_index ON public.laporan_wawancara USING btree (latitude, longitude);


--
-- Name: laporan_wawancara_status_laporan_status_sla_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX laporan_wawancara_status_laporan_status_sla_index ON public.laporan_wawancara USING btree (status_laporan, status_sla);


--
-- Name: log_keamanan_diakses_pada_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX log_keamanan_diakses_pada_index ON public.log_keamanan USING btree (diakses_pada);


--
-- Name: log_keamanan_ip_address_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX log_keamanan_ip_address_index ON public.log_keamanan USING btree (ip_address);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: hasil_assessment hasil_assessment_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hasil_assessment
    ADD CONSTRAINT hasil_assessment_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: laporan_opd_tujuan laporan_opd_tujuan_laporan_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan_opd_tujuan
    ADD CONSTRAINT laporan_opd_tujuan_laporan_id_foreign FOREIGN KEY (laporan_id) REFERENCES public.laporan_wawancara(id) ON DELETE CASCADE;


--
-- Name: laporan_opd_tujuan laporan_opd_tujuan_opd_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan_opd_tujuan
    ADD CONSTRAINT laporan_opd_tujuan_opd_id_foreign FOREIGN KEY (opd_id) REFERENCES public.opd(id) ON DELETE CASCADE;


--
-- Name: laporan_wawancara laporan_wawancara_opd_tujuan_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan_wawancara
    ADD CONSTRAINT laporan_wawancara_opd_tujuan_id_foreign FOREIGN KEY (opd_tujuan_id) REFERENCES public.opd(id) ON DELETE SET NULL;


--
-- Name: laporan_wawancara laporan_wawancara_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan_wawancara
    ADD CONSTRAINT laporan_wawancara_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: laporan_wawancara laporan_wawancara_verifikator_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laporan_wawancara
    ADD CONSTRAINT laporan_wawancara_verifikator_id_foreign FOREIGN KEY (verifikator_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: log_tindak_lanjut log_tindak_lanjut_laporan_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_tindak_lanjut
    ADD CONSTRAINT log_tindak_lanjut_laporan_id_foreign FOREIGN KEY (laporan_id) REFERENCES public.laporan_wawancara(id) ON DELETE CASCADE;


--
-- Name: log_tindak_lanjut log_tindak_lanjut_opd_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_tindak_lanjut
    ADD CONSTRAINT log_tindak_lanjut_opd_id_foreign FOREIGN KEY (opd_id) REFERENCES public.opd(id) ON DELETE SET NULL;


--
-- Name: log_tindak_lanjut log_tindak_lanjut_opd_limpah_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_tindak_lanjut
    ADD CONSTRAINT log_tindak_lanjut_opd_limpah_id_foreign FOREIGN KEY (opd_limpah_id) REFERENCES public.opd(id) ON DELETE SET NULL;


--
-- Name: log_tindak_lanjut log_tindak_lanjut_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_tindak_lanjut
    ADD CONSTRAINT log_tindak_lanjut_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_opd_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_opd_id_foreign FOREIGN KEY (opd_id) REFERENCES public.opd(id) ON DELETE SET NULL;


--
-- Name: users users_sekolah_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_sekolah_id_foreign FOREIGN KEY (sekolah_id) REFERENCES public.sekolah(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict BDZYCrZmSn5wD0pRP8vxc1wbaQWETSPY41CDSiA9PXRvWew2e1Yum41uGR3gKLz

