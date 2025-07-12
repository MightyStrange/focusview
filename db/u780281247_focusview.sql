-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Waktu pembuatan: 12 Jul 2025 pada 23.15
-- Versi server: 10.11.10-MariaDB
-- Versi PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u780281247_focusview`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `devices`
--

CREATE TABLE `devices` (
  `id` int(11) NOT NULL,
  `nama_bluetooth` varchar(255) DEFAULT NULL,
  `id_bluetooth` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `devices`
--

INSERT INTO `devices` (`id`, `nama_bluetooth`, `id_bluetooth`) VALUES
(1, 'FocusView', 'caOYU9P+LKiFOzsCRzshdQ=='),
(2, 'FocusView', 'dd2tyqpmGliDP7u/Lqzdew=='),
(3, 'FocusView', 'm/wlo3+ZgZYPXKtYuJHdog=='),
(4, 'FocusView', 'UT/eXqcivAQoPezXdK4qPg=='),
(5, 'Unknown Device', 'AJdcY35zV2Mv+mW01XJLGg=='),
(6, 'FocusView', 'pjG1wI2HcLWZDGaOjDPAxw=='),
(7, 'FocusView', 'jj9HEMTZivj8VMTP22EJWQ=='),
(8, 'FocusView', 'NMpothlsVGJ/lw2YaDh95A=='),
(9, 'FocusView', 'nSPBMQg6zF5i1lS1Q4Oy3Q=='),
(10, 'FocusView', 'oYFKHAaplILfDfxAXSrpUA=='),
(11, 'FocusView', 'TCt+owXudLs+KVFve543tA=='),
(12, 'FocusView', '3k7okaJjPGcP5L0sSJXUEw=='),
(13, 'FocusView', 'Q/dH8/NuTer/bhbK5D5s3g=='),
(14, 'FocusView', 'jPuKnTi9+eG7nijl4QEcoQ=='),
(15, 'FocusView', 'BFg1jCph4Iq7aMtMAtH6aw=='),
(16, 'FocusView', 'LMLyI13fFylvHC8Kjgc/PQ=='),
(17, 'FocusView', 'xcwmo2xSZH1rYagMN4b7YQ=='),
(18, 'FocusView', 'sUj/OsQmKEPW778sc2lZdg==');

-- --------------------------------------------------------

--
-- Struktur dari tabel `sleep_monitoring`
--

CREATE TABLE `sleep_monitoring` (
  `id` int(10) UNSIGNED NOT NULL,
  `log_time` datetime NOT NULL DEFAULT current_timestamp(),
  `device_name` varchar(60) DEFAULT NULL,
  `daily_microsleeps` smallint(5) UNSIGNED DEFAULT 0,
  `weekly_microsleeps` smallint(5) UNSIGNED DEFAULT 0,
  `weekly_hours` decimal(7,2) DEFAULT 0.00,
  `weekly_rate` decimal(5,2) DEFAULT 0.00,
  `monthly_microsleeps` mediumint(8) UNSIGNED DEFAULT 0,
  `monthly_hours` decimal(8,2) DEFAULT 0.00,
  `monthly_rate` decimal(5,2) DEFAULT 0.00,
  `total_hours` decimal(10,2) DEFAULT 0.00,
  `sleep_quality` enum('poor','average','good','excellent') DEFAULT 'average'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `sleep_monitoring`
--

INSERT INTO `sleep_monitoring` (`id`, `log_time`, `device_name`, `daily_microsleeps`, `weekly_microsleeps`, `weekly_hours`, `weekly_rate`, `monthly_microsleeps`, `monthly_hours`, `monthly_rate`, `total_hours`, `sleep_quality`) VALUES
(1, '2025-07-10 01:22:20', 'FocusView', 1, 1, 0.00, 0.00, 1, 0.00, 0.00, 0.00, 'excellent'),
(2, '2025-07-10 01:22:24', 'FocusView', 2, 2, 0.01, 0.00, 2, 0.01, 0.00, 0.00, 'excellent'),
(3, '2025-07-10 01:24:42', 'FocusView', 3, 3, 0.08, 0.00, 3, 0.08, 0.00, 0.00, 'good'),
(4, '2025-07-10 01:24:45', 'FocusView', 4, 4, 0.08, 0.00, 4, 0.08, 0.00, 0.00, 'good'),
(5, '2025-07-10 01:24:48', 'FocusView', 5, 5, 0.09, 0.00, 5, 0.09, 0.00, 0.00, 'good'),
(6, '2025-07-10 01:25:46', 'FocusView', 6, 6, 0.12, 50.00, 6, 0.12, 50.76, 0.00, ''),
(7, '2025-07-10 01:26:18', 'FocusView', 7, 7, 0.14, 51.00, 7, 0.14, 51.61, 0.00, ''),
(8, '2025-07-10 01:26:20', 'FocusView', 8, 8, 0.14, 58.00, 8, 0.14, 58.44, 0.00, '');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `id_perangkat` varchar(100) NOT NULL,
  `no_hp` varchar(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `nama`, `id_perangkat`, `no_hp`) VALUES
(1, 'tio', '$2y$10$ibpa2DpgULjVf7HphktDyeo9KA5nFzeyj9K6zycHMyMn1QAuzyzni', 'prasetio lukito', '1212', '085652130491'),
(2, 'apri', '$2y$10$vbe8k0GUQXDP.BtqSGcPluqVAGhtU1VPq5Mbam2Zzw7BFOFGVzsca', 'apriansyah', '122', '08984456789'),
(3, 'hafid', '$2y$10$ROBIjr4ErTQS/1MSgfavSOG9rHZabc9NQkI6MiySzXJnhxL89JiXi', 'hafidhts', '123', '081231231232'),
(4, 'hafidh1', '$2y$10$rdsDyHZav8l8nNNT/lcdt.yc48mH/s5Jeckpz.8G9t6N1HNDM.PBS', 'hafidh try siswanto', '1212', '08136498448448');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `devices`
--
ALTER TABLE `devices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_bluetooth` (`id_bluetooth`);

--
-- Indeks untuk tabel `sleep_monitoring`
--
ALTER TABLE `sleep_monitoring`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_log_time` (`log_time`),
  ADD KEY `idx_device` (`device_name`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `devices`
--
ALTER TABLE `devices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT untuk tabel `sleep_monitoring`
--
ALTER TABLE `sleep_monitoring`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
