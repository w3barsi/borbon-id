ALTER TABLE `borbon-id_student` ADD `status` text DEFAULT 'not_printed' NOT NULL;--> statement-breakpoint
UPDATE `borbon-id_student`
SET `status` = CASE
	WHEN `is_printed` = 1 THEN 'printed'
	ELSE 'not_printed'
END;
