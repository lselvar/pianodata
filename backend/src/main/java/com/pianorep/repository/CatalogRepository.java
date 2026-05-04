package com.pianorep.repository;

import com.pianorep.entity.Catalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CatalogRepository extends JpaRepository<Catalog, Integer>,
        JpaSpecificationExecutor<Catalog> {

    @Query("SELECT DISTINCT c.composer FROM Catalog c ORDER BY c.composer")
    List<String> findDistinctComposers();

    @Query("SELECT DISTINCT c.era FROM Catalog c WHERE c.era IS NOT NULL AND c.era != '' ORDER BY c.era")
    List<String> findDistinctEras();

    @Query("SELECT DISTINCT c.keyName FROM Catalog c WHERE c.keyName IS NOT NULL AND c.keyName != '' ORDER BY c.keyName")
    List<String> findDistinctKeys();

    @Query("SELECT DISTINCT c.tempoSpeed FROM Catalog c WHERE c.tempoSpeed IS NOT NULL AND c.tempoSpeed != '' ORDER BY c.tempoSpeed")
    List<String> findDistinctTempoSpeeds();

    @Query("SELECT DISTINCT c.level FROM Catalog c WHERE c.level IS NOT NULL AND c.level != '' ORDER BY c.level")
    List<String> findDistinctLevels();

    @Query("SELECT DISTINCT c.levelSecundo FROM Catalog c WHERE c.levelSecundo IS NOT NULL AND c.levelSecundo != '' ORDER BY c.levelSecundo")
    List<String> findDistinctLevelSecundos();

    @Query("SELECT DISTINCT c.rating FROM Catalog c WHERE c.rating IS NOT NULL ORDER BY c.rating")
    List<Integer> findDistinctRatings();

    @Query("SELECT DISTINCT c.mood FROM Catalog c WHERE c.mood IS NOT NULL AND c.mood != '' ORDER BY c.mood")
    List<String> findDistinctMoods();

    @Query("SELECT DISTINCT c.type FROM Catalog c WHERE c.type IS NOT NULL AND c.type != '' ORDER BY c.type")
    List<String> findDistinctTypes();

    @Query("SELECT DISTINCT c.etude FROM Catalog c WHERE c.etude IS NOT NULL AND c.etude != '' ORDER BY c.etude")
    List<String> findDistinctEtudes();
}
