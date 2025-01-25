delimiter $$

CREATE TABLE `sess_wa` (
  `idsess_wa` int(11) NOT NULL AUTO_INCREMENT,
  `id` varchar(45) DEFAULT NULL,
  `qr` text DEFAULT NULL,
  `number` varchar(45) DEFAULT NULL,
  `msg` varchar(245) DEFAULT NULL,
  `credate` timestamp NULL DEFAULT current_timestamp(),
  `is_wazap` int(1) DEFAULT NULL,
  `hp_wazap` varchar(45) DEFAULT NULL,
  `api_wazap` varchar(45) DEFAULT NULL,
  `number_wazap` varchar(45) DEFAULT NULL,
  `ismst` int(1) DEFAULT 0,
  PRIMARY KEY (`idsess_wa`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1$$

delimiter $$

CREATE TABLE `crm_h2` (
  `idcrm` int(11) NOT NULL AUTO_INCREMENT,
  `idsales` int(11) DEFAULT NULL,
  `hp` varchar(45) DEFAULT NULL,
  `nama` varchar(245) DEFAULT NULL,
  `isi` text DEFAULT NULL,
  `creadate` timestamp NULL DEFAULT current_timestamp(),
  `sentdate` datetime DEFAULT NULL,
  `resp` text DEFAULT NULL,
  `creaby` varchar(45) DEFAULT NULL,
  `judul` varchar(45) DEFAULT NULL,
  `pic` varchar(245) DEFAULT NULL,
  `stat` varchar(100) DEFAULT NULL,
  `acceptdate` datetime DEFAULT NULL,
  `istest` int(1) DEFAULT 0,
  `srctest` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`idcrm`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1$$

