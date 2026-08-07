"#!/usr/bin/perl
use strict;
use warnings;
local $/;
open my $in, '<', 'index.html' or die $!;
my $html = <$in>;
close $in;
my $old = q|$('activePeriodGauge').textContent=active?.[1]?periodLabel[active[0]]:'—'|;
my $new = q|$('activePeriod').textContent=active?.[1]?periodLabel[active[0]]:'—'|;
my $pos = index($html, $old);
if ($pos >= 0) {
  substr($html, $pos, length($old)) = $new;
  open my $out, '>', 'index.html' or die $!;
  print $out $html;
  close $out;
  print \"replaced\\n\";
} else {
  print \"not found\\n\";
}
"