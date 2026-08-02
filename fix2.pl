"#!/usr/bin/perl
use strict;
use warnings;
local $/;
open my $in, '<', 'index.html' or die $!;
my $html = <$in>;
close $in;
my $old = q|$('activePeriodGauge').textContent=active?.[1]?periodLabel[active[0]]:'—'|;
my $new = q|$('activePeriod').textContent=active?.[1]?periodLabel[active[0]]:'—'|;
$html =~ s/\Q$old\E/$new/g;
open my $out, '>', 'index.html' or die $!;
print $out $html;
close $out;
print \"done\\n\";
"