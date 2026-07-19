-- ===========================================================================
-- 0014 · Reviewing an already-graded quiz attempt
--
-- submit_quiz_attempt() reveals the answer key and explanations exactly
-- once, in its return value — but a student who navigates away and comes
-- back (or opens the result on another device) needs to see that same
-- reveal again. The fix is NOT a SELECT policy on quiz_questions/options:
-- that would make explanations permanently queryable by anyone who once
-- submitted any attempt on the quiz, which is a wider hole than intended.
-- Instead, this is the same reveal, gated the same way, through another
-- SECURITY DEFINER function — the disclosure boundary stays centralised.
-- ===========================================================================

create or replace function public.get_attempt_result(p_attempt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_attempt public.quiz_attempts;
begin
  select * into v_attempt from public.quiz_attempts where id = p_attempt_id;

  if not found then
    raise exception 'Attempt not found' using errcode = 'P0002';
  end if;
  if v_attempt.user_id <> (select auth.uid()) and not public.is_admin() then
    raise exception 'This is not your attempt' using errcode = '42501';
  end if;
  if v_attempt.submitted_at is null then
    raise exception 'This attempt has not been submitted yet' using errcode = '22023';
  end if;

  return jsonb_build_object(
    'score_points', v_attempt.score_points,
    'total_points', v_attempt.total_points,
    'score_pct', v_attempt.score_pct,
    'passed', v_attempt.passed,
    'pass_mark_pct', (select pass_mark_pct from public.quizzes where id = v_attempt.quiz_id),
    'questions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', qq.id,
        'body', qq.body,
        'explanation', qq.explanation,
        'chosen_option_id', a.option_id,
        'correct_option_id', (
          select o2.id from public.quiz_options o2
          where o2.question_id = qq.id and o2.is_correct limit 1
        ),
        'is_correct', a.is_correct
      ) order by qq.sort_order), '[]'::jsonb)
      from public.quiz_questions qq
      left join public.quiz_attempt_answers a
        on a.question_id = qq.id and a.attempt_id = p_attempt_id
      where qq.quiz_id = v_attempt.quiz_id
    )
  );
end;
$$;

revoke all on function public.get_attempt_result(uuid) from public;
grant execute on function public.get_attempt_result(uuid) to authenticated;
