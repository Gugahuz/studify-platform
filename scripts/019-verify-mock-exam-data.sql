-- Verify mock exam data exists
SELECT 'Templates' as table_name, COUNT(*) as count FROM mock_exam_templates
UNION ALL
SELECT 'Questions' as table_name, COUNT(*) as count FROM mock_exam_questions
UNION ALL
SELECT 'Active Templates' as table_name, COUNT(*) as count FROM mock_exam_templates WHERE is_active = true;

-- Show template details
SELECT 
  id,
  title,
  category,
  total_questions,
  time_limit_minutes,
  is_active
FROM mock_exam_templates 
ORDER BY created_at;

-- Show questions for first template
SELECT 
  t.title as template_title,
  q.question_number,
  LEFT(q.question_text, 50) as question_preview,
  q.question_type,
  jsonb_array_length(q.options) as option_count
FROM mock_exam_templates t
JOIN mock_exam_questions q ON t.id = q.template_id
WHERE t.is_active = true
ORDER BY t.title, q.question_number
LIMIT 10;
