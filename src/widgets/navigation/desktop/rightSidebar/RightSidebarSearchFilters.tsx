import { RadioOption } from "../../../../shared/ui/RadioOption";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import RightSidebarCard from "./RightSidebarCard";
import { sidebarCardActionClassName } from "./RightSidebarCard";
import AdvancedSearchModal from "../../../../features/discovery/components/search/AdvancedSearchModal";

import { useAuth } from "../../../../features/auth/hooks/useAuth";

import { APP_ROUTES } from "../../../../shared/config/routes";

import { parseSearchCriteria } from "../../../../features/discovery/lib/search";

import type { SearchCriteria } from "../../../../features/discovery/types/search";
import type { SearchLocation } from "../../../../features/discovery/types/search";
import type { SearchPeople } from "../../../../features/discovery/types/search";

export default function RightSidebarSearchFilters() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const criteria = parseSearchCriteria(searchParams);

  const updateCriteria = (next: SearchCriteria) => {
    navigate(APP_ROUTES.search(next), { replace: true });
  };

  return (
    <>
      <RightSidebarCard
        title="Фільтри пошуку"
        footer={
          <button
            type="button"
            onClick={() => setAdvancedOpen(true)}
            className={sidebarCardActionClassName}
          >
            Розширений пошук
          </button>
        }
      >
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-foreground">
              Люди
            </legend>
            <div role="radiogroup" aria-label="Люди" className="space-y-2">
              <RadioOption<SearchPeople>
                className="text-foreground"
                checked={criteria.people === "anyone"}
                label="Від будь-кого"
                value="anyone"
                onChange={(people) => updateCriteria({ ...criteria, people })}
              />
              <RadioOption<SearchPeople>
                className="text-foreground"
                checked={criteria.people === "following"}
                label="Ті, кого ви читаєте"
                value="following"
                onChange={(people) => updateCriteria({ ...criteria, people })}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-bold text-foreground">
              Місце
            </legend>
            <div role="radiogroup" aria-label="Місце" className="space-y-2">
              <RadioOption<SearchLocation>
                className="text-foreground"
                checked={criteria.location === "anywhere"}
                label="Будь-де"
                value="anywhere"
                onChange={(location) =>
                  updateCriteria({ ...criteria, location })
                }
              />
              <RadioOption<SearchLocation>
                className="text-foreground"
                checked={criteria.location === "near"}
                disabled={!user?.location}
                label="Поруч із вами"
                value="near"
                onChange={(location) =>
                  updateCriteria({ ...criteria, location })
                }
              />
            </div>
            {!user?.location && (
              <p className="mt-2 text-xs text-muted-foreground">
                Додайте місце в профіль для пошуку поруч.
              </p>
            )}
          </fieldset>
        </div>
      </RightSidebarCard>

      {advancedOpen && (
        <AdvancedSearchModal
          criteria={criteria}
          viewerHasLocation={Boolean(user?.location)}
          onApply={(next) => {
            updateCriteria(next);
            setAdvancedOpen(false);
          }}
          onClose={() => setAdvancedOpen(false)}
        />
      )}
    </>
  );
}
