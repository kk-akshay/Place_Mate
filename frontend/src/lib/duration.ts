export function formatDuration(
  totalSeconds: number,
): string {
  const safeSeconds =
    Math.max(
      0,
      Math.round(
        totalSeconds,
      ),
    );


  const hours =
    Math.floor(
      safeSeconds
      / 3600,
    );


  const minutes =
    Math.floor(
      (
        safeSeconds
        % 3600
      )
      / 60,
    );


  const seconds =
    safeSeconds
    % 60;


  if (
    hours > 0
  ) {
    if (
      minutes === 0
    ) {
      return `${hours}h`;
    }


    return (
      `${hours}h ${minutes}m`
    );
  }


  if (
    minutes > 0
  ) {
    return (
      `${minutes}m ${seconds}s`
    );
  }


  return `${seconds}s`;
}


export function getModuleLabel(
  module: string,
): string {
  const labels:
    Record<
      string,
      string
    > = {
      aptitude:
        "Aptitude",

      coding:
        "Coding",

      technical_interview:
        "Technical Interview",

      hr_interview:
        "HR Interview",

      resume:
        "Resume",
    };


  return (
    labels[module]
    ?? module
  );
}