-- Answers are compared without accents: "está" = "esta", "años" = "anos", "één" = "een".
-- Before, accented letters were removed completely ("está" became "est"), so a correct answer typed
-- without the accent was marked wrong.
create or replace function public.norm_answer(t text)
 returns text
 language sql
 immutable
 set search_path to 'public'
as $function$
  select trim(regexp_replace(
           regexp_replace(
             translate(lower(translate(coalesce(t, ''), '’‘“”–—', '''''""--')),
                       'áàâäãéèêëíìîïóòôöõúùûüñç', 'aaaaaeeeeiiiiooooouuuunc'),
             '[^a-z0-9 ]', '', 'g'),
         '\s+', ' ', 'g'));
$function$;
